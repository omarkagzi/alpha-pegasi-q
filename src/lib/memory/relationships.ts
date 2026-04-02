// src/lib/memory/relationships.ts
// Agent-to-agent relationship arc progression — updates relationship records
// after heartbeat events. Arc transitions are deterministic (code-driven
// thresholds, not LLM judgment).

import type { SupabaseClient } from '@supabase/supabase-js';

// ── Types ──

interface RelationshipRow {
  id: string;
  interaction_count: number;
  aggregate_sentiment: string;
  shared_topics: string[];
  notable_moments: string[];
  arc_stage: string;
}

interface HeartbeatEvent {
  description: string;
  event_category: string;
  event_type: string;
  involved_agents: string[];
}

// ── Topic extraction (keyword-based, not LLM) ──

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'bridge': ['bridge', 'crossing'],
  'market': ['market', 'trade', 'stall', 'merchant', 'goods'],
  'weather': ['rain', 'storm', 'sun', 'wind', 'snow', 'weather'],
  'harvest': ['harvest', 'crop', 'grain', 'farming'],
  'construction': ['build', 'repair', 'timber', 'stone', 'wall', 'roof'],
  'library': ['library', 'book', 'scroll', 'archive', 'reading'],
  'festival': ['festival', 'celebration', 'ceremony', 'gathering'],
  'food': ['food', 'cook', 'meal', 'bread', 'tavern'],
  'council': ['council', 'meeting', 'decision', 'vote'],
  'visitors': ['visitor', 'newcomer', 'traveler', 'stranger'],
};

function extractTopics(description: string): string[] {
  const lower = description.toLowerCase();
  const found: string[] = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.push(topic);
    }
  }
  return found;
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)];
}

// ── Arc stage thresholds ──

const ARC_THRESHOLDS = {
  acquaintance: 3,
  familiar: 7,
  close: 15,
} as const;

// ── Core functions ──

/**
 * Loads an existing relationship between two agents, or creates one.
 * Always stores entity_a_id < entity_b_id (lexicographic) to avoid duplicates.
 */
async function loadOrCreateRelationship(
  supabase: SupabaseClient,
  agentAId: string,
  agentBId: string,
): Promise<RelationshipRow> {
  // Normalize ordering to prevent duplicate pairs
  const [entityA, entityB] = agentAId < agentBId
    ? [agentAId, agentBId]
    : [agentBId, agentAId];

  const { data: existing } = await supabase
    .from('relationships')
    .select('id, interaction_count, aggregate_sentiment, shared_topics, notable_moments, arc_stage')
    .eq('entity_a_id', entityA)
    .eq('entity_a_type', 'agent')
    .eq('entity_b_id', entityB)
    .eq('entity_b_type', 'agent')
    .maybeSingle();

  if (existing) return existing as RelationshipRow;

  // Create new relationship
  const { data: created, error } = await supabase
    .from('relationships')
    .insert({
      entity_a_id: entityA,
      entity_a_type: 'agent',
      entity_b_id: entityB,
      entity_b_type: 'agent',
      interaction_count: 0,
      aggregate_sentiment: 'neutral',
      shared_topics: [],
      notable_moments: [],
      arc_stage: 'new',
    })
    .select('id, interaction_count, aggregate_sentiment, shared_topics, notable_moments, arc_stage')
    .single();

  if (error || !created) {
    throw new Error(`Failed to create relationship: ${error?.message}`);
  }

  return created as RelationshipRow;
}

/**
 * Updates the relationship between two agents after a heartbeat event.
 * Handles: interaction count, topics, arc stage progression, sentiment
 * shifts from tension events, and notable moment tracking.
 */
export async function updateRelationshipFromEvent(
  supabase: SupabaseClient,
  agentAId: string,
  agentBId: string,
  event: HeartbeatEvent,
): Promise<void> {
  const rel = await loadOrCreateRelationship(supabase, agentAId, agentBId);

  // Increment interaction count
  const newCount = rel.interaction_count + 1;

  // Extract topics from event description
  const newTopics = extractTopics(event.description);
  const mergedTopics = dedupe([...rel.shared_topics, ...newTopics]).slice(-10);

  // Progress arc stage based on count thresholds
  let newArcStage = rel.arc_stage;
  if (newCount >= ARC_THRESHOLDS.close && rel.arc_stage !== 'close' && rel.arc_stage !== 'strained') {
    newArcStage = 'close';
  } else if (newCount >= ARC_THRESHOLDS.familiar && rel.arc_stage === 'acquaintance') {
    newArcStage = 'familiar';
  } else if (newCount >= ARC_THRESHOLDS.acquaintance && rel.arc_stage === 'new') {
    newArcStage = 'acquaintance';
  }

  // Tension events shift sentiment downward
  let newSentiment = rel.aggregate_sentiment;
  if (event.event_category === 'tension') {
    if (newSentiment === 'warm') newSentiment = 'neutral';
    else if (newSentiment === 'neutral') newSentiment = 'cool';

    // Close relationships can become strained through repeated tension
    if (
      newArcStage === 'close' &&
      rel.notable_moments.filter(
        (m) => m.toLowerCase().includes('disagree') || m.toLowerCase().includes('tension')
      ).length >= 3
    ) {
      newArcStage = 'strained';
    }
  }

  // Milestone and social events trend sentiment upward
  if (event.event_category === 'milestone' || event.event_category === 'social') {
    if (newSentiment === 'tense') newSentiment = 'cool';
    else if (newSentiment === 'cool') newSentiment = 'neutral';
    else if (newSentiment === 'neutral') newSentiment = 'warm';
  }

  // Roll notable_moments (keep last 5) — only significant events
  let updatedNotable = rel.notable_moments;
  if (
    event.event_category === 'tension' ||
    event.event_category === 'milestone' ||
    event.event_type === 'trade'
  ) {
    updatedNotable = [...rel.notable_moments, event.description].slice(-5);
  }

  await supabase
    .from('relationships')
    .update({
      interaction_count: newCount,
      aggregate_sentiment: newSentiment,
      shared_topics: mergedTopics,
      notable_moments: updatedNotable,
      arc_stage: newArcStage,
      last_interaction: new Date().toISOString(),
    })
    .eq('id', rel.id);
}

/**
 * Updates relationships for all agent pairs involved in a heartbeat event.
 * For a 2-agent event, updates 1 relationship.
 * For a 3+ agent event, updates all pairwise combinations.
 */
export async function updateRelationshipsFromEvent(
  supabase: SupabaseClient,
  event: HeartbeatEvent,
): Promise<void> {
  const agents = event.involved_agents;
  if (agents.length < 2) return; // solo events don't create relationships

  const updates: Promise<void>[] = [];
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      updates.push(updateRelationshipFromEvent(supabase, agents[i], agents[j], event));
    }
  }
  await Promise.all(updates);
}
