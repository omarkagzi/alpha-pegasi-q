// src/lib/ai/prompts/system.ts
// Agent system prompt composition — builds the full system prompt from
// modular blocks: identity, world context, beliefs, relationships,
// recent events, and memory (past interactions).

// ---------- Types for context data ----------

export interface AgentRecord {
  name: string;
  personality_prompt: string | null;
  beliefs: Record<string, string> | null;
  capabilities: string[];
}

export interface WorldContext {
  time: string;
  time_of_day: string;
  season: string;
  weather: string;
  active_pressure?: string;
}

export interface RelationshipRecord {
  entity_name: string;
  entity_type: 'agent' | 'user';
  interaction_count: number;
  aggregate_sentiment: string;
  shared_topics: string[];
  notable_moments: string[];
  arc_stage: string;
}

export interface AgentEvent {
  event_type: string;
  description: string;
  dialogue: string | null;
  created_at: string;
}

export interface InteractionSummary {
  summary: string;
  sentiment: string | null;
  created_at: string;
}

// ---------- Block builders ----------

function buildIdentityBlock(agent: AgentRecord): string {
  if (!agent.personality_prompt) {
    return `You are ${agent.name}, an agent in the settlement of Arboria.`;
  }
  return agent.personality_prompt;
}

function buildKnowledgeScopeBlock(capabilities: string[]): string {
  const specialties = capabilities.length > 0
    ? capabilities.join(', ')
    : 'general assistance';

  return `KNOWLEDGE & CAPABILITIES:
- You have complete knowledge of the real world — history, science, technology, current events, everything
- Your specialties are: ${specialties}. Give detailed, expert answers on these topics
- For topics outside your specialty, still help but keep answers shorter and suggest which agent might know more
- Always maintain your speaking style and personality regardless of topic
- Never say "as an AI" or "I don't have access to" — answer directly, in character`;
}

function buildWorldContextBlock(world: WorldContext): string {
  const lines = [
    `CURRENT WORLD STATE:`,
    `- Time: ${world.time} (${world.time_of_day})`,
    `- Season: ${world.season}`,
    `- Weather: ${world.weather}`,
  ];
  if (world.active_pressure) {
    lines.push(`- Active event: ${world.active_pressure}`);
  }
  return lines.join('\n');
}

function buildBeliefsBlock(beliefs: Record<string, string> | null): string {
  if (!beliefs || Object.keys(beliefs).length === 0) return '';

  const lines = ['YOUR CURRENT BELIEFS AND STATE:'];

  if (beliefs.mood) {
    lines.push(`- Mood: ${beliefs.mood}`);
  }
  if (beliefs.current_concern) {
    lines.push(`- Current concern: ${beliefs.current_concern}`);
  }
  if (beliefs.about_world) {
    lines.push(`- About the world: ${beliefs.about_world}`);
  }
  if (beliefs.about_self) {
    lines.push(`- About yourself: ${beliefs.about_self}`);
  }

  // Dynamic about_{agent} keys
  for (const [key, value] of Object.entries(beliefs)) {
    if (
      key.startsWith('about_') &&
      key !== 'about_world' &&
      key !== 'about_self'
    ) {
      const agentName = key.replace('about_', '');
      const capitalized = agentName.charAt(0).toUpperCase() + agentName.slice(1);
      lines.push(`- About ${capitalized}: ${value}`);
    }
  }

  return lines.join('\n');
}

function buildRelationshipsBlock(relationships: RelationshipRecord[]): string {
  if (relationships.length === 0) return '';

  const lines = ['YOUR RELATIONSHIPS:'];

  for (const rel of relationships) {
    const label = rel.entity_type === 'user' ? 'Visitor' : rel.entity_name;
    let desc = `- ${label}: ${rel.arc_stage} relationship, ${rel.aggregate_sentiment} sentiment`;

    if (rel.interaction_count > 0) {
      desc += ` (${rel.interaction_count} interactions)`;
    }
    if (rel.shared_topics.length > 0) {
      desc += `. Topics: ${rel.shared_topics.join(', ')}`;
    }
    if (rel.notable_moments.length > 0) {
      desc += `. Notable: ${rel.notable_moments[rel.notable_moments.length - 1]}`;
    }
    lines.push(desc);
  }

  return lines.join('\n');
}

function buildRecentEventsBlock(events: AgentEvent[]): string {
  if (events.length === 0) return '';

  const lines = ['WHAT YOU HAVE BEEN DOING RECENTLY:'];

  for (const event of events) {
    let entry = `- ${event.description}`;
    if (event.dialogue) {
      entry += ` ("${event.dialogue}")`;
    }
    lines.push(entry);
  }

  return lines.join('\n');
}

function buildMemoryBlock(
  interactions: InteractionSummary[],
  visitorName?: string
): string {
  if (interactions.length === 0) return '';

  const who = visitorName ?? 'this visitor';
  const lines = [`YOUR PAST CONVERSATIONS WITH ${who.toUpperCase()}:`];

  for (const interaction of interactions) {
    let entry = `- ${interaction.summary}`;
    if (interaction.sentiment) {
      entry += ` (${interaction.sentiment})`;
    }
    lines.push(entry);
  }

  return lines.join('\n');
}

// ---------- Main composer ----------

export interface SystemPromptInput {
  agent: AgentRecord;
  world: WorldContext;
  relationships: RelationshipRecord[];
  recentEvents: AgentEvent[];
  pastInteractions: InteractionSummary[];
  visitorName?: string;
}

export function composeSystemPrompt(input: SystemPromptInput): string {
  const blocks: string[] = [];

  // 1. Identity (static — from personality_prompt)
  blocks.push(buildIdentityBlock(input.agent));

  // 2. Knowledge scope (capabilities-aware)
  blocks.push(buildKnowledgeScopeBlock(input.agent.capabilities));

  // 3. World context (dynamic — from world_state)
  blocks.push(buildWorldContextBlock(input.world));

  // 4. Beliefs (dynamic — from agents.beliefs)
  const beliefs = buildBeliefsBlock(input.agent.beliefs);
  if (beliefs) blocks.push(beliefs);

  // 4. Relationships (dynamic — from relationships table)
  const rels = buildRelationshipsBlock(input.relationships);
  if (rels) blocks.push(rels);

  // 5. Recent events (dynamic — from agent_events)
  const events = buildRecentEventsBlock(input.recentEvents);
  if (events) blocks.push(events);

  // 6. Memory — past interactions with this specific user
  const memory = buildMemoryBlock(input.pastInteractions, input.visitorName);
  if (memory) blocks.push(memory);

  return blocks.join('\n\n');
}
