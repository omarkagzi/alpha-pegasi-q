// src/lib/ai/prompts/narrator.ts
// World heartbeat narrator prompt — generates agent-to-agent events.
// Called by the heartbeat orchestrator every 6 minutes via QStash.
// Uses gemini-2.0-flash-lite for cost efficiency.

export interface NarratorContext {
  agents: {
    name: string;
    beliefs: Record<string, string> | null;
    last_heartbeat: string | null;
  }[];
  relationships: {
    agent_a: string;
    agent_b: string;
    arc_stage: string;
    aggregate_sentiment: string;
    shared_topics: string[];
    notable_moments: string[];
  }[];
  world: {
    time: string;
    time_of_day: string;
    season: string;
    weather: string;
    active_pressure?: string;
  };
  recentEvents: {
    description: string;
    event_category: string;
    involved_agents: string[];
    created_at: string;
  }[];
  cooldowns: Record<string, number>;
}

export function buildNarratorPrompt(ctx: NarratorContext): string {
  const agentList = ctx.agents
    .map((a) => {
      const mood = a.beliefs?.mood ?? 'unknown';
      const concern = a.beliefs?.current_concern ?? 'none';
      return `- ${a.name}: mood="${mood}", concern="${concern}"`;
    })
    .join('\n');

  const relationshipList = ctx.relationships
    .map((r) => {
      let desc = `- ${r.agent_a} ↔ ${r.agent_b}: ${r.arc_stage}, ${r.aggregate_sentiment}`;
      if (r.shared_topics.length > 0) {
        desc += `. Topics: ${r.shared_topics.join(', ')}`;
      }
      if (r.notable_moments.length > 0) {
        desc += `. Recent: ${r.notable_moments[r.notable_moments.length - 1]}`;
      }
      return desc;
    })
    .join('\n');

  const recentList =
    ctx.recentEvents.length > 0
      ? ctx.recentEvents
          .map((e) => `- [${e.event_category}] ${e.involved_agents.join(', ')}: ${e.description}`)
          .join('\n')
      : '- No recent events.';

  const blockedCategories = Object.entries(ctx.cooldowns)
    .filter(([, remaining]) => remaining > 0)
    .map(([cat]) => cat);

  const cooldownNote =
    blockedCategories.length > 0
      ? `Categories on cooldown (do NOT use): ${blockedCategories.join(', ')}`
      : 'No category cooldowns active.';

  return `You are the narrator of a small settlement called Arboria. Your job is to generate a single world event — something one or two agents are doing right now.

WORLD STATE:
- Time: ${ctx.world.time} (${ctx.world.time_of_day})
- Season: ${ctx.world.season}
- Weather: ${ctx.world.weather}
${ctx.world.active_pressure ? `- Active event: ${ctx.world.active_pressure}` : ''}

AGENTS IN THE SETTLEMENT:
${agentList}

RELATIONSHIPS:
${relationshipList}

RECENT EVENTS (avoid repeating these):
${recentList}

${cooldownNote}

RULES:
1. Generate exactly ONE event. Pick 1 or 2 agents.
2. The event must feel natural given the time of day, weather, and agent moods.
3. If two agents are involved, their dialogue must reflect their relationship stage and sentiment.
4. Do NOT repeat the same event type or topic as a recent event.
5. Vary the agents — do not always pick the same ones.
6. Keep descriptions to 1-2 sentences. Keep dialogue to 2-4 short lines if applicable.

Respond in this exact JSON format:
{
  "event_type": "conversation" | "activity" | "observation" | "trade" | "reaction",
  "event_category": "social" | "craft" | "observation" | "errand" | "reflection" | "tension" | "milestone",
  "involved_agents": ["AgentName"] or ["AgentName1", "AgentName2"],
  "location": "A specific place in the settlement",
  "description": "1-2 sentence description of what is happening",
  "dialogue": "Agent1: \\"line\\" Agent2: \\"line\\"" or null if no dialogue
}`;
}
