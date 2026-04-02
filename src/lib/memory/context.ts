// src/lib/memory/context.ts
// Context assembler — queries Supabase for all context data needed to
// compose an agent's system prompt for a chat session.
// Runs all queries in parallel for minimum latency.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  composeSystemPrompt,
  type AgentRecord,
  type WorldContext,
  type RelationshipRecord,
  type AgentEvent,
  type InteractionSummary,
} from '@/lib/ai/prompts/system';

export interface AgentContextResult {
  systemPrompt: string;
  agent: {
    id: string;
    name: string;
    provider: string;
    model_id: string;
    beliefs: Record<string, string> | null;
  };
}

/**
 * Assembles the full context for an agent chat session.
 * Queries agent record, relationships, past interactions, recent events,
 * and world state in parallel, then composes the system prompt.
 */
export async function assembleAgentContext(
  supabase: SupabaseClient,
  agentId: string,
  userId: string,
  clerkId: string
): Promise<AgentContextResult> {
  // Run all queries in parallel
  const [agentResult, relationshipResult, interactionsResult, eventsResult, worldResult] =
    await Promise.all([
      // 1. Agent record
      supabase
        .from('agents')
        .select('id, name, personality_prompt, beliefs, provider, model_id')
        .eq('id', agentId)
        .single(),

      // 2. Relationship between this user and this agent
      supabase
        .from('relationships')
        .select(
          'interaction_count, aggregate_sentiment, shared_topics, notable_moments, arc_stage'
        )
        .eq('entity_a_id', userId)
        .eq('entity_a_type', 'user')
        .eq('entity_b_id', agentId)
        .eq('entity_b_type', 'agent')
        .maybeSingle(),

      // 3. Last 5 interaction summaries for this user + agent
      supabase
        .from('interactions')
        .select('summary, sentiment, created_at')
        .eq('agent_id', agentId)
        .eq('initiator_clerk_id', clerkId) // interactions table uses clerk_id
        .order('created_at', { ascending: false })
        .limit(5),

      // 4. Last 3 events involving this agent
      supabase
        .from('agent_events')
        .select('event_type, description, dialogue, created_at')
        .contains('involved_agents', [agentId])
        .order('created_at', { ascending: false })
        .limit(3),

      // 5. World state
      supabase
        .from('world_state')
        .select('current_time, time_of_day, season, weather, active_pressure')
        .eq('biome', 'arboria_market_town')
        .single(),
    ]);

  if (agentResult.error || !agentResult.data) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  const agentData = agentResult.data;

  // Build agent record for prompt composition
  const agent: AgentRecord = {
    name: agentData.name,
    personality_prompt: agentData.personality_prompt,
    beliefs: agentData.beliefs,
  };

  // Build world context (fallback to sensible defaults if world_state missing)
  const world: WorldContext = worldResult.data
    ? {
        time: worldResult.data.current_time ?? '12:00',
        time_of_day: worldResult.data.time_of_day ?? 'day',
        season: worldResult.data.season ?? 'autumn',
        weather: worldResult.data.weather ?? 'clear',
        active_pressure: worldResult.data.active_pressure ?? undefined,
      }
    : { time: '12:00', time_of_day: 'day', season: 'autumn', weather: 'clear' };

  // Build relationships array
  const relationships: RelationshipRecord[] = [];
  if (relationshipResult.data) {
    relationships.push({
      entity_name: 'You (the visitor)',
      entity_type: 'user',
      interaction_count: relationshipResult.data.interaction_count ?? 0,
      aggregate_sentiment: relationshipResult.data.aggregate_sentiment ?? 'neutral',
      shared_topics: relationshipResult.data.shared_topics ?? [],
      notable_moments: relationshipResult.data.notable_moments ?? [],
      arc_stage: relationshipResult.data.arc_stage ?? 'new',
    });
  }

  // Build recent events
  const recentEvents: AgentEvent[] = (eventsResult.data ?? []).map((e: Record<string, unknown>) => ({
    event_type: e.event_type as string,
    description: e.description as string,
    dialogue: (e.dialogue as string) ?? null,
    created_at: e.created_at as string,
  }));

  // Build past interaction summaries
  const pastInteractions: InteractionSummary[] = (interactionsResult.data ?? []).map(
    (i: Record<string, unknown>) => ({
      summary: i.summary as string,
      sentiment: (i.sentiment as string) ?? null,
      created_at: i.created_at as string,
    })
  );

  const systemPrompt = composeSystemPrompt({
    agent,
    world,
    relationships,
    recentEvents,
    pastInteractions,
  });

  return {
    systemPrompt,
    agent: {
      id: agentData.id,
      name: agentData.name,
      provider: agentData.provider ?? 'gemini',
      model_id: agentData.model_id ?? 'gemini-2.0-flash',
      beliefs: agentData.beliefs,
    },
  };
}
