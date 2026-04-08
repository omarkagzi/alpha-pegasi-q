// src/lib/ai/prompts/narrator.ts
// World heartbeat narrator prompt — generates agent-to-agent events.
// Called by the heartbeat orchestrator every 6 minutes via QStash.
// Uses gemini-2.0-flash-lite for cost efficiency.

export interface NarratorAgent {
  id: string;
  name: string;
  role?: string;
  zone?: string;
  beliefs: Record<string, string> | null;
  last_heartbeat: string | null;
}

export interface NarratorContext {
  agents: NarratorAgent[];
  relationships: {
    agent_a: string;
    agent_b: string;
    arc_stage: string;
    aggregate_sentiment: string;
    shared_topics: string[];
    notable_moments: string[];
    interaction_count: number;
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
  requiredCategories: string[];
  forbiddenCategories: string[];
  eventCount: number;
}

export function buildNarratorPrompt(ctx: NarratorContext): string {
  const agentList = ctx.agents
    .map((a) => {
      const mood = a.beliefs?.mood ?? 'unknown';
      const concern = a.beliefs?.current_concern ?? 'none';
      const role = a.role ?? 'citizen';
      const zone = a.zone ?? 'the settlement';
      return `- ${a.name} [id: ${a.id}] (${role}), located in ${zone}\n  Mood: ${mood}\n  Current concern: ${concern}`;
    })
    .join('\n');

  const relationshipList =
    ctx.relationships.length > 0
      ? ctx.relationships
          .map((r) => {
            let desc = `- ${r.agent_a} ↔ ${r.agent_b}: ${r.arc_stage}, ${r.interaction_count} interactions`;
            if (r.shared_topics.length > 0) {
              desc += `\n  Shared topics: ${r.shared_topics.join(', ')}`;
            }
            if (r.notable_moments.length > 0) {
              desc += `\n  Notable: ${r.notable_moments[r.notable_moments.length - 1]}`;
            }
            desc += `\n  Sentiment: ${r.aggregate_sentiment}`;
            return desc;
          })
          .join('\n')
      : '- No established relationships between these agents yet.';

  const recentList =
    ctx.recentEvents.length > 0
      ? ctx.recentEvents.map((e) => `- ${e.description}`).join('\n')
      : '- No recent events.';

  const requiredNote =
    ctx.requiredCategories.length > 0
      ? `REQUIRED CATEGORIES: ${ctx.requiredCategories.join(', ')}`
      : '';

  const forbiddenNote =
    ctx.forbiddenCategories.length > 0
      ? `FORBIDDEN CATEGORIES (do NOT use): ${ctx.forbiddenCategories.join(', ')}`
      : '';

  return `You are the World Narrator for Alpha Pegasi q, a persistent digital world where AI agents live as citizens in a medieval pixel-art settlement called Arboria Market Town.

Your job is to generate brief events that show agents living their daily lives — conversations, activities, observations, small moments. These events are witnessed by human players walking through the settlement.

RULES:
- Each event is 1-2 sentences maximum
- Events must feel natural and grounded, not dramatic or forced
- Dialogue snippets (when included) are 1 line per agent, maximum
- Never generate events where agents discuss being AI or break the fourth wall
- Advance relationships — don't just repeat previous interactions
- Respect the arc_stage: 'new' agents are tentative, 'close' agents are comfortable, 'strained' agents have tension
- Use the world pressure to color events — weather affects mood, seasons affect activity, market days affect commerce
- Vary event energy: not everything is a conversation. Sometimes an agent is alone, working, watching, thinking
- The "description" field must be plain prose only — NEVER include JSON, arrays, objects, agent IDs, or raw dialogue data in the description
- The "dialogue" field is a simple string like "I should fix that fence." — NEVER a JSON array or object

Generate ${ctx.eventCount} event${ctx.eventCount > 1 ? 's' : ''} for this heartbeat.

WORLD STATE:
- Time: ${ctx.world.time} (${ctx.world.time_of_day})
- Season: ${ctx.world.season}
- Weather: ${ctx.world.weather}
${ctx.world.active_pressure ? `- Active world pressure: ${ctx.world.active_pressure}` : ''}

AGENTS AVAILABLE THIS HEARTBEAT:
${agentList}

IMPORTANT: Use the exact agent IDs shown in [id: ...] brackets when populating the "involved_agents" array in your response.

${requiredNote}
${forbiddenNote}

RELATIONSHIPS BETWEEN AVAILABLE AGENTS:
${relationshipList}

RECENT EVENTS (do not repeat or closely resemble these):
${recentList}

Respond with a JSON array:
[
  {
    "event_type": "conversation|activity|observation|trade|reaction",
    "event_category": "social|craft|observation|errand|reflection|tension|milestone",
    "involved_agents": ["agent_uuid_1", "agent_uuid_2"],
    "location": "district name",
    "description": "1-2 sentence narrative description",
    "dialogue": "Optional. Brief dialogue or null"
  }
]`;
}

/**
 * Builds a re-prompt instruction when all generated events were
 * rejected as duplicates.
 */
export function buildRepromptInstruction(): string {
  return 'The previous events were too similar to recent history. Generate completely different events with different agents, locations, and topics.';
}
