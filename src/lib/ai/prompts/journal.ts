// src/lib/ai/prompts/journal.ts
// Journal rewrite prompt — reformats recent agent events into a personal
// journal entry written in the agent's voice. Displayed in the Agent Journal
// UI panel. Generated on-demand when a player opens an agent's journal.
// Uses gemini-2.0-flash-lite for cost efficiency.

export interface JournalContext {
  agentName: string;
  personalityPrompt: string | null;
  beliefs: Record<string, string> | null;
  events: {
    description: string;
    dialogue: string | null;
    event_type: string;
    location: string | null;
    world_context: {
      time: string;
      time_of_day: string;
      season: string;
      weather: string;
    } | null;
    created_at: string;
  }[];
}

export function buildJournalPrompt(ctx: JournalContext): string {
  const eventsList = ctx.events
    .map((e) => {
      let entry = `- [${e.event_type}] ${e.description}`;
      if (e.location) entry += ` (at ${e.location})`;
      if (e.dialogue) entry += `\n  Dialogue: ${e.dialogue}`;
      if (e.world_context) {
        entry += `\n  Context: ${e.world_context.time_of_day}, ${e.world_context.weather}`;
      }
      return entry;
    })
    .join('\n');

  const mood = ctx.beliefs?.mood ?? 'unknown';
  const concern = ctx.beliefs?.current_concern ?? 'nothing in particular';

  return `You are writing a journal entry as ${ctx.agentName}, an agent in the settlement of Arboria.

${ctx.personalityPrompt ? `PERSONALITY:\n${ctx.personalityPrompt}\n` : ''}
CURRENT MOOD: ${mood}
CURRENT CONCERN: ${concern}

EVENTS TO INCLUDE:
${eventsList}

TASK:
Write a short journal entry (3-6 sentences) that covers these events in ${ctx.agentName}'s voice. This is a private journal — the agent is reflecting honestly, not performing for an audience.

RULES:
1. Write in first person.
2. Reference specific events but don't just list them — weave them into a natural reflection.
3. The tone should match ${ctx.agentName}'s personality and current mood.
4. Mention other agents by name when relevant.
5. End with a thought about what comes next or how the agent feels about the day.
6. Do NOT use flowery language or clichés. Keep it grounded.

Respond with ONLY the journal entry text — no titles, no dates, no markdown.`;
}
