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
import { getActivePressures, getWorldTimeInfo } from '@/lib/world/pressures';
import { getAvailableCategories, selectRequiredCategories, type RecentEvent } from '@/lib/world/categories';
import { selectAgentsForHeartbeat, type HeartbeatAgent } from '@/lib/world/agentSelection';
import { deduplicateEvents, type GeneratedEvent, type StoredEvent } from '@/lib/world/deduplication';
import { updateRelationshipsFromEvent } from '@/lib/memory/relationships';
import { buildNarratorPrompt, buildRepromptInstruction, type NarratorContext } from '@/lib/ai/prompts/narrator';
import { buildBeliefUpdatePrompt, type BeliefUpdateContext } from '@/lib/ai/prompts/beliefs';

const LITE_MODEL = 'gemini-2.0-flash-lite';
const GEMINI_API_KEY = () => process.env.GEMINI_API_KEY ?? '';

// Agent roles and default zones for narrator context
const AGENT_META: Record<string, { role: string; zone: string }> = {
  'Mira': { role: 'World Guide', zone: 'Settlement Gate' },
  'Forge': { role: 'Programmer/Technical', zone: 'Workshop Row' },
  'Archon': { role: 'Academia/Research', zone: 'Library District' },
  'Ledger': { role: 'Finance/Legal/Marketing', zone: 'Market Square' },
  'Ember': { role: 'Roleplay/Creative/General', zone: 'Tavern District' },
};

// ── Step 1: QStash Signature Verification ──

async function verifyQStashSignature(req: Request): Promise<boolean> {
  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  // In development, allow unauthenticated calls
  if (!signingKey || !nextSigningKey) {
    console.warn('[Heartbeat] QStash signing keys not configured — skipping verification');
    return true;
  }

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

// ── Step 6: Narrator LLM call ──

async function callNarrator(
  prompt: string,
  repromptHint?: string,
): Promise<GeneratedEvent[]> {
  const provider = createProvider('gemini', GEMINI_API_KEY());
  const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

  if (repromptHint) {
    messages.push({ role: 'user', content: repromptHint });
  }

  const result = await provider.chat(messages, {
    model: LITE_MODEL,
    temperature: 0.9,
    max_tokens: 1000,
    response_format: 'json',
  });

  // Parse the JSON response — handle both array and single object
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.content);
  } catch {
    console.error('[Heartbeat] Failed to parse narrator response:', result.content);
    return [];
  }

  const events = Array.isArray(parsed) ? parsed : [parsed];

  // Validate each event has required fields
  return events.filter(
    (e): e is GeneratedEvent =>
      typeof e === 'object' &&
      e !== null &&
      typeof (e as Record<string, unknown>).event_type === 'string' &&
      typeof (e as Record<string, unknown>).event_category === 'string' &&
      Array.isArray((e as Record<string, unknown>).involved_agents) &&
      typeof (e as Record<string, unknown>).description === 'string',
  ) as GeneratedEvent[];
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

  const provider = createProvider('gemini', GEMINI_API_KEY());

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
      const result = await provider.chat(
        [{ role: 'user', content: prompt }],
        { model: LITE_MODEL, temperature: 0.7, max_tokens: 500, response_format: 'json' },
      );

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

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  // ── Step 1: Validate QStash signature ──
  const isValid = await verifyQStashSignature(request.clone());
  if (!isValid) {
    console.error('[Heartbeat] Invalid QStash signature');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    let generatedEvents = await callNarrator(narratorPrompt);

    // Resolve any agent names to UUIDs
    generatedEvents = resolveAgentIds(generatedEvents, agentRoster);

    // Filter out events with no valid agents
    generatedEvents = generatedEvents.filter((e) => e.involved_agents.length > 0);

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

    // Re-prompt once if all events were rejected
    if (finalEvents.length === 0 && generatedEvents.length > 0) {
      console.log('[Heartbeat] All events deduplicated — re-prompting');
      const retryEvents = await callNarrator(narratorPrompt, buildRepromptInstruction());
      const resolvedRetry = resolveAgentIds(retryEvents, agentRoster)
        .filter((e) => e.involved_agents.length > 0);
      finalEvents = deduplicateEvents(resolvedRetry, recentForDedup);
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
      const { data: inserted, error } = await supabase
        .from('agent_events')
        .insert({
          event_type: event.event_type,
          event_category: event.event_category,
          involved_agents: event.involved_agents,
          location: event.location,
          description: event.description,
          dialogue: event.dialogue ?? null,
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
    if (timeInfo.heartbeat_count % 4 === 0) {
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
        belief_update: timeInfo.heartbeat_count % 4 === 0,
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
