// GET /api/agents/[agentId]/journal?period=today|week
// Generates on-demand journal entries in the agent's voice.
// Steps: Auth → Fetch agent + events + beliefs + relationships → LLM rewrite → Return

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createProvider, type ChatMessage } from '@/lib/ai/provider';
import { buildJournalPrompt, type JournalContext } from '@/lib/ai/prompts/journal';

const LITE_MODEL = 'gemini-2.0-flash-lite';
const LLM_TIMEOUT_MS = 10_000;

// Today = last 24 real minutes (~24 game-hours at 1 min = 1 game-hour)
const TODAY_WINDOW_MS = 24 * 60 * 1000;
// Week = last 168 real minutes (~7 game-days)
const WEEK_WINDOW_MS = 7 * 24 * 60 * 1000;

function getApiKey(): string {
  return process.env.GEMINI_API_KEY ?? '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const supabase = createAdminClient();

  // ── Auth ──
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json(
      { error: 'Sign in to read agent journals.' },
      { status: 401 }
    );
  }

  // ── Parse period ──
  const url = new URL(request.url);
  const period = url.searchParams.get('period') || 'today';
  const windowMs = period === 'week' ? WEEK_WINDOW_MS : TODAY_WINDOW_MS;
  const since = new Date(Date.now() - windowMs).toISOString();

  // ── Fetch agent ──
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, name, personality_prompt, beliefs')
    .eq('id', agentId)
    .single();

  if (agentError || !agent) {
    return NextResponse.json(
      { error: 'Agent not found.' },
      { status: 404 }
    );
  }

  // ── Fetch events ──
  const { data: events } = await supabase
    .from('agent_events')
    .select('description, dialogue, event_type, location, world_context, created_at')
    .contains('involved_agents', [agentId])
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(20);

  // ── Fetch relationships ──
  const { data: relationships } = await supabase
    .from('relationships')
    .select('agent_a, agent_b, label, interaction_count')
    .or(`agent_a.eq.${agentId},agent_b.eq.${agentId}`)
    .order('interaction_count', { ascending: false })
    .limit(10);

  // Resolve relationship agent names
  let relationshipEntries: { name: string; label: string; count: number }[] = [];
  if (relationships && relationships.length > 0) {
    const otherIds = relationships.map((r) =>
      r.agent_a === agentId ? r.agent_b : r.agent_a
    );
    const { data: otherAgents } = await supabase
      .from('agents')
      .select('id, name')
      .in('id', otherIds);

    const nameMap = new Map(otherAgents?.map((a) => [a.id, a.name]) ?? []);
    relationshipEntries = relationships.map((r) => {
      const otherId = r.agent_a === agentId ? r.agent_b : r.agent_a;
      return {
        name: nameMap.get(otherId) || 'Unknown',
        label: r.label || 'Acquaintance',
        count: r.interaction_count || 0,
      };
    });
  }

  // ── If no events, return empty journal ──
  if (!events || events.length === 0) {
    return NextResponse.json({
      period,
      agent_name: agent.name,
      entries: [],
      current_thoughts: agent.beliefs?.current_concern || null,
      relationships: relationshipEntries,
    });
  }

  // ── LLM call to rewrite events in agent's voice ──
  const journalCtx: JournalContext = {
    agentName: agent.name,
    personalityPrompt: agent.personality_prompt,
    beliefs: agent.beliefs as Record<string, string> | null,
    events: events.map((e) => ({
      description: e.description,
      dialogue: e.dialogue,
      event_type: e.event_type,
      location: e.location,
      world_context: e.world_context as JournalContext['events'][number]['world_context'],
      created_at: e.created_at,
    })),
  };

  const prompt = buildJournalPrompt(journalCtx);
  const llm = createProvider('gemini', getApiKey());

  const messages: ChatMessage[] = [
    { role: 'user', content: prompt },
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    const response = await llm.chat(messages, {
      model: LITE_MODEL,
      temperature: 0.7,
      max_tokens: 800,
    });

    clearTimeout(timeout);

    // Group events by time-of-day for structured display
    const groupedEntries = groupByTimeOfDay(events, response.content);

    return NextResponse.json({
      period,
      agent_name: agent.name,
      entries: groupedEntries,
      journal_text: response.content,
      current_thoughts: agent.beliefs?.current_concern || null,
      relationships: relationshipEntries,
    });
  } catch {
    // If LLM fails, return raw events without rewriting
    return NextResponse.json({
      period,
      agent_name: agent.name,
      entries: events.map((e) => ({
        time_of_day: extractTimeOfDay(e.world_context),
        text: e.description,
      })),
      journal_text: null,
      current_thoughts: agent.beliefs?.current_concern || null,
      relationships: relationshipEntries,
    });
  }
}

function extractTimeOfDay(worldContext: unknown): string {
  if (worldContext && typeof worldContext === 'object' && 'time_of_day' in worldContext) {
    return (worldContext as { time_of_day: string }).time_of_day;
  }
  return 'Day';
}

function groupByTimeOfDay(
  events: { world_context: unknown; created_at: string }[],
  journalText: string
): { time_of_day: string; text: string }[] {
  // Simple grouping: split journal text into paragraphs, assign time-of-day from events
  const paragraphs = journalText.split('\n\n').filter((p) => p.trim());

  if (paragraphs.length === 0) {
    return [{ time_of_day: 'Day', text: journalText }];
  }

  return paragraphs.map((para, i) => {
    const event = events[Math.min(i, events.length - 1)];
    return {
      time_of_day: extractTimeOfDay(event?.world_context),
      text: para.trim(),
    };
  });
}
