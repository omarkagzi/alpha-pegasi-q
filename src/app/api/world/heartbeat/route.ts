// POST /api/world/heartbeat
// World heartbeat orchestrator — 10-step pipeline that generates agent-to-agent
// events every 6 minutes via QStash cron. This is what makes the world feel alive.
//
// Pipeline: Validate → World State → Agent Selection → Category Selection →
//           Relationship Context → Narrate → Deduplicate → Store → Broadcast →
//           Belief Update (every 4th heartbeat)

import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { createAdminClient } from '@/lib/supabase/server';
import { createProvider, type ChatMessage } from '@/lib/ai/provider';
import { choosePolicy, getProviderApiKey, policyToLlmOptions } from '@/lib/ai/policyRouter';
import { getActivePressures, getWorldTimeInfo } from '@/lib/world/pressures';
import { getAvailableCategories, selectRequiredCategories, type RecentEvent } from '@/lib/world/categories';
import { selectAgentsForHeartbeat, type HeartbeatAgent } from '@/lib/world/agentSelection';
import { sanitizeEventText } from '@/lib/ai/sanitize';
import { deduplicateEvents, type GeneratedEvent, type StoredEvent } from '@/lib/world/deduplication';
import { updateRelationshipsFromEvent } from '@/lib/memory/relationships';
import { buildNarratorPrompt, buildRepromptInstruction, type NarratorContext } from '@/lib/ai/prompts/narrator';
import { buildBeliefUpdatePrompt, type BeliefUpdateContext } from '@/lib/ai/prompts/beliefs';

// Agent roles and default zones for narrator context
const AGENT_META: Record<string, { role: string; zone: string }> = {
  'Mira': { role: 'World Guide', zone: 'Settlement Gate' },
  'Forge': { role: 'Programmer/Technical', zone: 'Workshop Row' },
  'Archon': { role: 'Academia/Research', zone: 'Library District' },
  'Ledger': { role: 'Finance/Legal/Marketing', zone: 'Market Square' },
  'Ember': { role: 'Roleplay/Creative/General', zone: 'Tavern District' },
};

// ── Step 1: Request Verification ──
// Accepts three auth methods:
//   1. QStash signature (upstash-signature header)
//   2. Vercel Cron secret (Authorization: Bearer <CRON_SECRET>)
//   3. Dev fallback (no keys configured)

async function verifyRequest(req: Request): Promise<boolean> {
  // Method 2: Vercel Cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Method 1: QStash signature
  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (signingKey && nextSigningKey) {
    const receiver = new Receiver({
      currentSigningKey: signingKey,
      nextSigningKey: nextSigningKey,
    });

    const body = await req.text();
    const signature = req.headers.get('upstash-signature') ?? '';

    try {
      await receiver.verify({ signature, body });
      return true;
    } catch {
      return false;
    }
  }

  // Method 3: Dev fallback — no auth configured
  if (!signingKey && !nextSigningKey && !cronSecret) {
    console.warn('[Heartbeat] No auth configured — allowing request (dev mode)');
    return true;
  }

  return false;
}

// ── Step 6: Narrator LLM call ──

function parseNarratorResponse(raw: string, label: string): GeneratedEvent[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(`[Heartbeat] Failed to parse narrator response (${label}):`, raw.slice(0, 500));
    return [];
  }

  // Some providers wrap arrays in {events: [...]} or {result: [...]}; unwrap defensively.
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.events)) parsed = obj.events;
    else if (Array.isArray(obj.result)) parsed = obj.result;
  }

  const events = Array.isArray(parsed) ? parsed : [parsed];

  const valid = events.filter(
    (e): e is GeneratedEvent =>
      typeof e === 'object' &&
      e !== null &&
      typeof (e as Record<string, unknown>).event_type === 'string' &&
      typeof (e as Record<string, unknown>).event_category === 'string' &&
      Array.isArray((e as Record<string, unknown>).involved_agents) &&
      typeof (e as Record<string, unknown>).description === 'string',
  ) as GeneratedEvent[];

  if (events.length > 0 && valid.length === 0) {
    console.warn(
      `[Heartbeat] Narrator returned ${events.length} item(s) but none passed schema validation (${label}). First item:`,
      JSON.stringify(events[0]).slice(0, 300),
    );
  }

  return valid;
}

async function callNarrator(
  prompt: string,
  repromptHint?: string,
): Promise<GeneratedEvent[]> {
  const narratorPolicy = choosePolicy('heartbeat', 'steward');
  const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
  if (repromptHint) {
    messages.push({ role: 'user', content: repromptHint });
  }
  const llmOptions = policyToLlmOptions(narratorPolicy);

  // Try primary provider (groq), then fall back to gemini on any error or empty result.
  // Gemini fallback is critical: groq's free tier hits a daily token cap that silently
  // breaks the heartbeat. Without this fallback, the world freezes for hours.
  const primaryKey = getProviderApiKey(narratorPolicy.provider);
  if (primaryKey) {
    try {
      const provider = createProvider(narratorPolicy.provider, primaryKey);
      const result = await provider.chat(messages, llmOptions);
      const events = parseNarratorResponse(result.content, narratorPolicy.provider);
      if (events.length > 0) return events;
      console.warn(`[Heartbeat] Narrator (${narratorPolicy.provider}) returned 0 valid events — trying fallback`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Heartbeat] Narrator primary (${narratorPolicy.provider}) failed:`, msg);
    }
  } else {
    console.warn(`[Heartbeat] No API key for primary provider ${narratorPolicy.provider}`);
  }

  const fallbackKey = getProviderApiKey(narratorPolicy.fallbackProvider);
  if (!fallbackKey) {
    console.error(`[Heartbeat] No API key for fallback provider ${narratorPolicy.fallbackProvider} — giving up`);
    return [];
  }

  try {
    const fallback = createProvider(narratorPolicy.fallbackProvider, fallbackKey);
    const result = await fallback.chat(messages, { ...llmOptions, model: narratorPolicy.fallbackModel });
    const events = parseNarratorResponse(result.content, narratorPolicy.fallbackProvider);
    if (events.length === 0) {
      console.warn(`[Heartbeat] Fallback (${narratorPolicy.fallbackProvider}) also returned 0 valid events`);
    }
    return events;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Heartbeat] Narrator fallback (${narratorPolicy.fallbackProvider}) failed:`, msg);
    return [];
  }
}

// ── UUID Resolution Fallback ──

/**
 * If the LLM returns agent names instead of UUIDs, resolve them.
 */
function resolveAgentIds(
  events: GeneratedEvent[],
  agentRoster: HeartbeatAgent[],
): GeneratedEvent[] {
  const nameToId = new Map<string, string>();
  const validIds = new Set<string>();

  for (const agent of agentRoster) {
    nameToId.set(agent.name.toLowerCase(), agent.id);
    validIds.add(agent.id);
  }

  return events.map((event) => ({
    ...event,
    involved_agents: event.involved_agents
      .map((idOrName) => {
        if (validIds.has(idOrName)) return idOrName;
        // Fallback: resolve name to ID
        const resolved = nameToId.get(idOrName.toLowerCase());
        return resolved ?? null;
      })
      .filter((id): id is string => id !== null),
  }));
}

// ── Step 10: Belief Update Cycle ──

async function runBeliefUpdate(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<void> {
  // Select 1-2 agents whose beliefs are most stale
  const { data: agents } = await supabase
    .from('agents')
    .select('id, name, beliefs')
    .not('personality_prompt', 'is', null)
    .order('last_heartbeat', { ascending: true, nullsFirst: true })
    .limit(2);

  if (!agents || agents.length === 0) return;

  const beliefPolicy = choosePolicy('heartbeat', 'steward');

  // Beliefs intentionally invert the policy's primary/fallback ordering:
  // try GEMINI first, fall back to GROQ. Why: the narrator runs on Groq and
  // belief updates fire concurrently in the same minute as a downstream
  // heartbeat, eating Groq's 6000 TPM budget and 429-ing the narrator
  // (observed in production 2026-04-27). Splitting providers gives beliefs
  // their own rate-limit bucket so they can't starve the narrator.
  const callBeliefLLM = async (messages: ChatMessage[]) => {
    const geminiKey = getProviderApiKey(beliefPolicy.fallbackProvider); // 'gemini'
    if (geminiKey) {
      try {
        const provider = createProvider(beliefPolicy.fallbackProvider, geminiKey);
        return await provider.chat(messages, {
          ...policyToLlmOptions(beliefPolicy),
          model: beliefPolicy.fallbackModel,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[Heartbeat] Belief LLM gemini failed: ${msg} — trying groq`);
      }
    }
    const groqKey = getProviderApiKey(beliefPolicy.provider); // 'groq'
    if (!groqKey) throw new Error('No API key for groq fallback on belief update');
    const groq = createProvider(beliefPolicy.provider, groqKey);
    return groq.chat(messages, { ...policyToLlmOptions(beliefPolicy) });
  };

  for (const agent of agents) {
    try {
      // Fetch recent events involving this agent
      const { data: recentEvents } = await supabase
        .from('agent_events')
        .select('description, involved_agents, dialogue, created_at')
        .contains('involved_agents', [agent.id])
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch relationships for this agent
      const { data: relsA } = await supabase
        .from('relationships')
        .select('entity_b_id, arc_stage, aggregate_sentiment, interaction_count, shared_topics')
        .eq('entity_a_id', agent.id)
        .eq('entity_a_type', 'agent');

      const { data: relsB } = await supabase
        .from('relationships')
        .select('entity_a_id, arc_stage, aggregate_sentiment, interaction_count, shared_topics')
        .eq('entity_b_id', agent.id)
        .eq('entity_b_type', 'agent');

      // Resolve relationship partner names
      const relPartnerIds = [
        ...(relsA ?? []).map((r) => r.entity_b_id),
        ...(relsB ?? []).map((r) => r.entity_a_id),
      ];

      const { data: partnerAgents } = relPartnerIds.length > 0
        ? await supabase
            .from('agents')
            .select('id, name')
            .in('id', relPartnerIds)
        : { data: [] };

      const idToName = new Map((partnerAgents ?? []).map((a) => [a.id, a.name]));

      const relationships = [
        ...(relsA ?? []).map((r) => ({
          entity_name: idToName.get(r.entity_b_id) ?? 'Unknown',
          arc_stage: r.arc_stage,
          aggregate_sentiment: r.aggregate_sentiment,
          interaction_count: r.interaction_count,
          shared_topics: r.shared_topics ?? [],
        })),
        ...(relsB ?? []).map((r) => ({
          entity_name: idToName.get(r.entity_a_id) ?? 'Unknown',
          arc_stage: r.arc_stage,
          aggregate_sentiment: r.aggregate_sentiment,
          interaction_count: r.interaction_count,
          shared_topics: r.shared_topics ?? [],
        })),
      ];

      const beliefCtx: BeliefUpdateContext = {
        agentName: agent.name,
        currentBeliefs: agent.beliefs ?? {},
        recentEvents: (recentEvents ?? []).map((e) => ({
          description: e.description,
          involved_agents: e.involved_agents,
          dialogue: e.dialogue,
          created_at: e.created_at,
        })),
        relationships,
      };

      const prompt = buildBeliefUpdatePrompt(beliefCtx);
      const result = await callBeliefLLM([{ role: 'user', content: prompt }]);

      let updatedBeliefs: Record<string, string>;
      try {
        updatedBeliefs = JSON.parse(result.content);
      } catch {
        console.error(`[Heartbeat] Failed to parse beliefs for ${agent.name}:`, result.content);
        continue;
      }

      await supabase
        .from('agents')
        .update({ beliefs: updatedBeliefs })
        .eq('id', agent.id);

      // Broadcast belief update to connected clients
      const beliefChannel = supabase.channel('world-events:arboria_market_town');
      await beliefChannel.send({
        type: 'broadcast',
        event: 'belief-update',
        payload: { agentId: agent.id, agentName: agent.name, beliefs: updatedBeliefs },
      });

      console.log(`[Heartbeat] Updated beliefs for ${agent.name}`);
    } catch (err) {
      console.error(`[Heartbeat] Belief update failed for ${agent.name}:`, err);
    }
  }
}

// ── Main Route Handler ──

// Vercel Cron sends GET requests
export async function GET(request: NextRequest) {
  return handleHeartbeat(request);
}

// QStash sends POST requests
export async function POST(request: NextRequest) {
  return handleHeartbeat(request);
}

async function handleHeartbeat(request: NextRequest) {
  const supabase = createAdminClient();

  // ── Step 1: Verify request authenticity ──
  const isValid = await verifyRequest(request.clone());
  if (!isValid) {
    console.error('[Heartbeat] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Step 1b: Adaptive heartbeat — gate based on active user population ──
  // ARCHITECTURE NOTE: The current heartbeat processes one shared world (Arboria).
  // Per-user worlds don't exist yet, so this logic gates whether the heartbeat
  // runs AT ALL, not per-user. When per-user worlds are added, this filtering
  // will need to select which worlds to process.
  //
  // What this achieves:
  // - Skip heartbeat entirely if no users have been active recently (saves ~100% of LLM cost)
  // - Reduce cadence when only free-tier users are active (saves ~80% of LLM cost)
  // - Full cadence when any Steward is active

  const now = new Date();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS).toISOString();

  // Activity signal = MAX(last_login, most recent conversation_session.updated_at).
  // last_login alone misses users who chat without re-authenticating (the chat
  // route updates it now, but pre-existing rows can be stale). Pulling session
  // activity gives a richer "is anyone actually using the world" signal.
  const [{ data: usersData }, { data: recentSessions }] = await Promise.all([
    supabase.from('users').select('id, tier, last_login'),
    supabase
      .from('conversation_sessions')
      .select('user_id, updated_at')
      .gte('updated_at', sevenDaysAgo),
  ]);

  if (!usersData || usersData.length === 0) {
    return NextResponse.json({
      events: [],
      meta: { skipped: true, reason: 'no_users' },
    });
  }

  const lastSessionByUser = new Map<string, number>();
  for (const s of recentSessions ?? []) {
    const prev = lastSessionByUser.get(s.user_id) ?? 0;
    const t = new Date(s.updated_at).getTime();
    if (t > prev) lastSessionByUser.set(s.user_id, t);
  }

  const lastSeenMs = (u: { id: string; last_login: string | null }) => {
    const loginMs = u.last_login ? new Date(u.last_login).getTime() : 0;
    const sessionMs = lastSessionByUser.get(u.id) ?? 0;
    return Math.max(loginMs, sessionMs);
  };

  const hasActiveSteward = usersData.some(
    (u) => u.tier === 'steward' && now.getTime() - lastSeenMs(u) < SEVEN_DAYS_MS,
  );
  const hasActiveTraveler = usersData.some(
    (u) => u.tier !== 'steward' && now.getTime() - lastSeenMs(u) < THREE_DAYS_MS,
  );

  if (!hasActiveSteward && !hasActiveTraveler) {
    return NextResponse.json({
      events: [],
      meta: { skipped: true, reason: 'all_worlds_dormant' },
    });
  }

  // If only travelers are active (no stewards), reduce to ~30-min cadence
  if (!hasActiveSteward) {
    const minuteOfDay = now.getHours() * 60 + now.getMinutes();
    const heartbeatSlot = Math.floor(minuteOfDay / 6);
    if (heartbeatSlot % 5 !== 0) {
      return NextResponse.json({
        events: [],
        meta: { skipped: true, reason: 'traveler_only_reduced_cadence' },
      });
    }
  }

  // If we reach here: at least one steward is active → full 6-min cadence
  // OR: traveler-only AND this is the 1-in-5 heartbeat slot → proceed

  try {
    // ── Step 2: Load world state ──
    const timeInfo = getWorldTimeInfo();

    const { data: worldRow } = await supabase
      .from('world_state')
      .select('current_time, time_of_day, season, weather')
      .eq('biome', 'arboria_market_town')
      .single();

    const worldState = {
      current_time: worldRow?.current_time ?? timeInfo.current_time,
      time_of_day: worldRow?.time_of_day ?? timeInfo.time_of_day,
      season: worldRow?.season ?? 'autumn',
      weather: worldRow?.weather ?? 'clear',
      game_day: timeInfo.game_day,
    };

    // Check world pressure calendar
    const activePressures = await getActivePressures(worldState, supabase);
    const pressureHint = activePressures.length > 0
      ? activePressures.map((p) => p.narrative_hint).join('. ')
      : undefined;

    // ── Step 3: Agent selection ──
    const { data: allAgents } = await supabase
      .from('agents')
      .select('id, name, beliefs, last_heartbeat')
      .not('personality_prompt', 'is', null);

    if (!allAgents || allAgents.length === 0) {
      return NextResponse.json({ error: 'No agents available' }, { status: 500 });
    }

    const agentRoster: HeartbeatAgent[] = allAgents.map((a) => ({
      id: a.id,
      name: a.name,
      beliefs: a.beliefs,
      last_heartbeat: a.last_heartbeat,
      zone: AGENT_META[a.name]?.zone,
    }));

    const selectedAgents = selectAgentsForHeartbeat(agentRoster);

    // ── Step 4: Category selection ──
    const { data: recentEventRows } = await supabase
      .from('agent_events')
      .select('event_category, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const recentForCooldown: RecentEvent[] = (recentEventRows ?? []).map((e) => ({
      event_category: e.event_category,
      created_at: e.created_at,
    }));

    const availableCategories = getAvailableCategories(recentForCooldown);
    const { required, forbidden } = selectRequiredCategories(availableCategories, recentForCooldown);

    // ── Step 5: Relationship context ──
    const selectedIds = selectedAgents.map((a) => a.id);
    const { data: relRows } = await supabase
      .from('relationships')
      .select('entity_a_id, entity_b_id, arc_stage, aggregate_sentiment, shared_topics, notable_moments, interaction_count')
      .eq('entity_a_type', 'agent')
      .eq('entity_b_type', 'agent');

    // Filter to relationships between selected agents
    const selectedIdSet = new Set(selectedIds);
    const relevantRels = (relRows ?? []).filter(
      (r) => selectedIdSet.has(r.entity_a_id) && selectedIdSet.has(r.entity_b_id),
    );

    // Map agent IDs to names for relationship display
    const idToName = new Map(agentRoster.map((a) => [a.id, a.name]));

    // ── Step 6: Narrate via LLM ──
    const eventCount = Math.floor(Math.random() * 3) + 1; // 1-3 events

    // Load last 5 event descriptions for dedup context in prompt
    const { data: last5Events } = await supabase
      .from('agent_events')
      .select('description, event_category, involved_agents, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const narratorCtx: NarratorContext = {
      agents: selectedAgents.map((a) => ({
        id: a.id,
        name: a.name,
        role: AGENT_META[a.name]?.role,
        zone: AGENT_META[a.name]?.zone,
        beliefs: a.beliefs,
        last_heartbeat: a.last_heartbeat,
      })),
      relationships: relevantRels.map((r) => ({
        agent_a: idToName.get(r.entity_a_id) ?? r.entity_a_id,
        agent_b: idToName.get(r.entity_b_id) ?? r.entity_b_id,
        arc_stage: r.arc_stage,
        aggregate_sentiment: r.aggregate_sentiment,
        shared_topics: r.shared_topics ?? [],
        notable_moments: r.notable_moments ?? [],
        interaction_count: r.interaction_count ?? 0,
      })),
      world: {
        time: worldState.current_time,
        time_of_day: worldState.time_of_day,
        season: worldState.season,
        weather: worldState.weather,
        active_pressure: pressureHint,
      },
      recentEvents: (last5Events ?? []).map((e) => ({
        description: e.description,
        event_category: e.event_category,
        involved_agents: e.involved_agents ?? [],
        created_at: e.created_at,
      })),
      requiredCategories: required,
      forbiddenCategories: forbidden,
      eventCount,
    };

    const narratorPrompt = buildNarratorPrompt(narratorCtx);
    const narratorRaw = await callNarrator(narratorPrompt);
    console.log(`[Heartbeat] Narrator returned ${narratorRaw.length} raw events`);

    // Resolve any agent names to UUIDs
    const resolved = resolveAgentIds(narratorRaw, agentRoster);

    // Filter out events with no valid agents — log if this drops anything
    const generatedEvents = resolved.filter((e) => e.involved_agents.length > 0);
    if (resolved.length > generatedEvents.length) {
      console.warn(
        `[Heartbeat] Dropped ${resolved.length - generatedEvents.length} event(s) with unresolved agents. Roster: ${agentRoster.map((a) => a.name).join(',')}. First dropped:`,
        JSON.stringify(resolved.find((e) => e.involved_agents.length === 0))?.slice(0, 300),
      );
    }

    // ── Step 7: Deduplicate ──
    const { data: last20Events } = await supabase
      .from('agent_events')
      .select('involved_agents, location, description')
      .order('created_at', { ascending: false })
      .limit(20);

    const recentForDedup: StoredEvent[] = (last20Events ?? []).map((e) => ({
      involved_agents: e.involved_agents ?? [],
      location: e.location,
      description: e.description,
    }));

    let finalEvents = deduplicateEvents(generatedEvents, recentForDedup);
    if (generatedEvents.length > finalEvents.length) {
      console.warn(`[Heartbeat] Dedup removed ${generatedEvents.length - finalEvents.length} of ${generatedEvents.length} event(s)`);
    }

    // Re-prompt once if we ended up with nothing — covers BOTH "all dedup'd" and
    // "narrator returned empty" cases. Previously only fired on the dedup path,
    // which let parse-failures and empty narrator outputs slip through silently.
    if (finalEvents.length === 0) {
      console.log('[Heartbeat] Zero events after dedup — re-prompting');
      const retryEvents = await callNarrator(narratorPrompt, buildRepromptInstruction());
      console.log(`[Heartbeat] Re-prompt returned ${retryEvents.length} raw events`);
      const resolvedRetry = resolveAgentIds(retryEvents, agentRoster)
        .filter((e) => e.involved_agents.length > 0);
      finalEvents = deduplicateEvents(resolvedRetry, recentForDedup);
      if (finalEvents.length === 0) {
        console.warn('[Heartbeat] Re-prompt also produced 0 final events');
      }
    }

    if (finalEvents.length === 0) {
      console.log('[Heartbeat] No events generated this cycle');
      return NextResponse.json({ events: [], message: 'No events this cycle' });
    }

    // ── Step 8: Store events + update state ──
    const worldContext = {
      time: worldState.current_time,
      time_of_day: worldState.time_of_day,
      season: worldState.season,
      weather: worldState.weather,
      active_pressure: activePressures[0]?.id ?? null,
    };

    const storedEvents: Array<Record<string, unknown>> = [];

    for (const event of finalEvents) {
      // Sanitize LLM output — strip any embedded JSON from prose fields
      const cleanDescription = sanitizeEventText(event.description);
      const cleanDialogue = event.dialogue ? sanitizeEventText(event.dialogue) : null;

      // Skip event if description is empty after sanitization
      if (!cleanDescription) {
        console.warn('[Heartbeat] Skipping event with empty description after sanitization');
        continue;
      }

      const { data: inserted, error } = await supabase
        .from('agent_events')
        .insert({
          event_type: event.event_type,
          event_category: event.event_category,
          involved_agents: event.involved_agents,
          location: event.location,
          description: cleanDescription,
          dialogue: cleanDialogue,
          world_context: worldContext,
        })
        .select()
        .single();

      if (error) {
        console.error('[Heartbeat] Failed to insert event:', error);
        continue;
      }

      storedEvents.push(inserted);

      // Update last_heartbeat on involved agents
      await supabase
        .from('agents')
        .update({ last_heartbeat: new Date().toISOString() })
        .in('id', event.involved_agents);

      // Update relationships for agent pairs in this event
      await updateRelationshipsFromEvent(supabase, {
        description: event.description,
        event_category: event.event_category,
        event_type: event.event_type,
        involved_agents: event.involved_agents,
      });
    }

    // ── Step 9: Broadcast to connected clients ──
    const channel = supabase.channel('world-events:arboria_market_town');
    await channel.send({
      type: 'broadcast',
      event: 'heartbeat',
      payload: { events: storedEvents },
    });

    // Broadcast relationship updates — collect all agent pairs that were updated
    const updatedPairs = storedEvents
      .filter((e) => Array.isArray(e.involved_agents) && (e.involved_agents as string[]).length >= 2)
      .map((e) => e.involved_agents as string[]);
    if (updatedPairs.length > 0) {
      await channel.send({
        type: 'broadcast',
        event: 'relationships-updated',
        payload: { pairs: updatedPairs },
      });
    }

    // ── Step 10: Belief update (every 4th heartbeat) ──
    if (timeInfo.heartbeat_count % 8 === 0) {
      // Run async — don't block the response
      runBeliefUpdate(supabase).catch((err) =>
        console.error('[Heartbeat] Belief update error:', err),
      );
    }

    console.log(`[Heartbeat] Generated ${storedEvents.length} events (day ${timeInfo.game_day}, ${worldState.time_of_day})`);

    return NextResponse.json({
      events: storedEvents,
      meta: {
        game_day: timeInfo.game_day,
        time: worldState.current_time,
        agents_selected: selectedAgents.map((a) => a.name),
        categories_required: required,
        pressures_active: activePressures.map((p) => p.id),
        belief_update: timeInfo.heartbeat_count % 8 === 0,
      },
    });
  } catch (err) {
    console.error('[Heartbeat] Pipeline error:', err);
    return NextResponse.json(
      { error: 'Heartbeat pipeline failed' },
      { status: 500 },
    );
  }
}
