// src/lib/ai/prompts/beliefs.ts
// Belief update prompt — synthesizes recent events and relationships into
// an updated worldview for an agent. Runs every 4th heartbeat for 1-2 agents.
// Uses gemini-2.0-flash-lite for cost efficiency.

export interface BeliefUpdateContext {
  agentName: string;
  currentBeliefs: Record<string, string>;
  recentEvents: {
    description: string;
    involved_agents: string[];
    dialogue: string | null;
    created_at: string;
  }[];
  relationships: {
    entity_name: string;
    arc_stage: string;
    aggregate_sentiment: string;
    interaction_count: number;
    shared_topics: string[];
  }[];
}

export function buildBeliefUpdatePrompt(ctx: BeliefUpdateContext): string {
  const currentBeliefsFormatted = Object.entries(ctx.currentBeliefs)
    .map(([key, value]) => `  "${key}": "${value}"`)
    .join(',\n');

  const eventsList =
    ctx.recentEvents.length > 0
      ? ctx.recentEvents
          .map((e) => {
            let entry = `- ${e.description}`;
            if (e.dialogue) entry += ` (${e.dialogue})`;
            return entry;
          })
          .join('\n')
      : '- Nothing notable has happened recently.';

  const relationshipsList = ctx.relationships
    .map(
      (r) =>
        `- ${r.entity_name}: ${r.arc_stage} (${r.aggregate_sentiment}, ${r.interaction_count} interactions). Topics: ${r.shared_topics.join(', ') || 'none'}`
    )
    .join('\n');

  return `You are updating the internal beliefs of ${ctx.agentName}, an agent in the settlement of Arboria.

CURRENT BELIEFS:
{
${currentBeliefsFormatted}
}

RECENT EVENTS SINCE LAST UPDATE:
${eventsList}

CURRENT RELATIONSHIPS:
${relationshipsList}

TASK:
Based on recent events and relationships, produce an updated beliefs object for ${ctx.agentName}. Write in ${ctx.agentName}'s voice — first person, reflecting their personality.

RULES:
1. GRADUAL CHANGE ONLY. No dramatic flips. Beliefs shift incrementally: "Don't know him" → "Met the scholar" → "He knows less about building than he thinks" → "Actually, his structural analysis was sound."
2. EVENT-ANCHORED. Every change must reference a specific recent event. No vague shifts like "I feel happier." Instead: "The bridge timber arrived today — that's been weighing on me."
3. Update "mood" to reflect recent events. Tension → frustrated/pensive. Collaboration → satisfied. Quiet day → steady/content.
4. "about_self" EVOLVES SLOWEST. This represents deep self-perception that shifts over weeks, not days. Preserve the existing "about_self" unless multiple significant events directly challenge it. This is the long game.
5. Add new "about_{name}" entries for any new entities ${ctx.agentName} has interacted with.
6. Update "current_concern" if resolved or if a new concern has emerged.
7. Keep each belief to 1-2 sentences.
8. Do NOT invent events that didn't happen.

Respond with ONLY the JSON object — no explanation, no markdown fences.

{
  "about_world": "...",
  "about_self": "...",
  "current_concern": "...",
  "mood": "...",
  "about_{agent_name}": "..."
}`;
}
