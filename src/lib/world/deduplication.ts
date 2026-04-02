// src/lib/world/deduplication.ts
// Lightweight deduplication — prevents repetitive heartbeat events
// by comparing new events against recent history using Jaccard similarity.

export interface GeneratedEvent {
  event_type: string;
  event_category: string;
  involved_agents: string[];
  location: string;
  description: string;
  dialogue: string | null;
}

export interface StoredEvent {
  involved_agents: string[];
  location: string | null;
  description: string;
}

/** Tokenize a string into lowercase word tokens. */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2) // skip tiny words
  );
}

/** Jaccard similarity between two sets: |A ∩ B| / |A ∪ B| */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Check if two UUID arrays share any elements. */
function arraysOverlap(a: string[], b: string[]): boolean {
  const setB = new Set(b);
  return a.some((id) => setB.has(id));
}

/**
 * Returns true if the new event is too similar to any recent event.
 * Similarity requires: overlapping agents + same location + similar description.
 */
export function isDuplicateEvent(
  newEvent: GeneratedEvent,
  recentEvents: StoredEvent[],
  threshold: number = 0.7,
): boolean {
  const newTokens = tokenize(newEvent.description);

  for (const recent of recentEvents) {
    const sameAgents = arraysOverlap(newEvent.involved_agents, recent.involved_agents);
    const sameLocation =
      newEvent.location.toLowerCase() === (recent.location ?? '').toLowerCase();
    const similarDescription =
      jaccardSimilarity(newTokens, tokenize(recent.description)) > threshold;

    if (sameAgents && sameLocation && similarDescription) {
      return true;
    }
  }
  return false;
}

/**
 * Filters an array of generated events, removing duplicates.
 * Returns the events that passed deduplication.
 */
export function deduplicateEvents(
  generated: GeneratedEvent[],
  recentEvents: StoredEvent[],
): GeneratedEvent[] {
  return generated.filter((event) => !isDuplicateEvent(event, recentEvents));
}
