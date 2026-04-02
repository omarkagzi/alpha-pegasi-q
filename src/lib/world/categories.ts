// src/lib/world/categories.ts
// Category cooldown system — deterministic variety enforcement.
// Categories have minimum heartbeat gaps between uses so the narrator
// doesn't repeat the same type of event too often.

const HEARTBEAT_INTERVAL_MS = 6 * 60 * 1000; // 6 real minutes

export const CATEGORY_COOLDOWNS: Record<string, number> = {
  social: 2,      // can repeat after 2 heartbeats (~12 min)
  craft: 2,
  observation: 1, // lighter cooldown — filler events
  errand: 2,
  reflection: 3,  // rarer, more impactful when it appears
  tension: 4,     // tension is meaningful and rare
  milestone: 8,   // milestones are special
};

export interface RecentEvent {
  event_category: string;
  created_at: string; // ISO timestamp
}

/**
 * Returns categories whose cooldowns have expired based on recent events.
 * The heartbeat pipeline uses this to constrain the narrator prompt.
 */
export function getAvailableCategories(recentEvents: RecentEvent[]): string[] {
  const now = Date.now();
  // Track the most recent heartbeat index for each category
  const categoryCounts: Record<string, number> = {};

  for (const event of recentEvents) {
    const heartbeatsAgo = Math.floor(
      (now - new Date(event.created_at).getTime()) / HEARTBEAT_INTERVAL_MS
    );
    const cat = event.event_category;
    if (categoryCounts[cat] === undefined || heartbeatsAgo < categoryCounts[cat]) {
      categoryCounts[cat] = heartbeatsAgo;
    }
  }

  return Object.entries(CATEGORY_COOLDOWNS)
    .filter(([cat, cooldown]) => {
      const lastSeen = categoryCounts[cat];
      return lastSeen === undefined || lastSeen >= cooldown;
    })
    .map(([cat]) => cat);
}

/**
 * Selects 1-2 required categories from the available pool,
 * weighted toward least recently used.
 */
export function selectRequiredCategories(
  available: string[],
  recentEvents: RecentEvent[],
): { required: string[]; forbidden: string[] } {
  if (available.length === 0) {
    // All on cooldown — allow observation as fallback
    return { required: ['observation'], forbidden: [] };
  }

  const now = Date.now();
  // Score each available category by how long since last used (higher = less recent)
  const scored = available.map((cat) => {
    const lastEvent = recentEvents.find((e) => e.event_category === cat);
    const recency = lastEvent
      ? (now - new Date(lastEvent.created_at).getTime()) / HEARTBEAT_INTERVAL_MS
      : 100; // never used = high score
    return { cat, recency };
  });

  // Sort by recency descending (least recently used first)
  scored.sort((a, b) => b.recency - a.recency);

  // Pick 1-2 from the top
  const count = Math.min(scored.length, Math.random() < 0.5 ? 1 : 2);
  const required = scored.slice(0, count).map((s) => s.cat);

  // Forbidden = all categories NOT available (on cooldown)
  const allCategories = Object.keys(CATEGORY_COOLDOWNS);
  const forbidden = allCategories.filter((cat) => !available.includes(cat));

  return { required, forbidden };
}
