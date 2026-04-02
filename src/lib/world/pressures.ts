// src/lib/world/pressures.ts
// World pressure calendar — injects thematic context into heartbeat events.
// Pressures create narrative seasons (market days, storms, festivals) that
// prevent events from feeling randomly generated.

import type { SupabaseClient } from '@supabase/supabase-js';

// ── Types ──

type PressureTrigger =
  | { type: 'recurring'; every_n_game_days: number }
  | { type: 'weather'; condition: string; min_duration_heartbeats: number }
  | { type: 'season_event'; season: string; game_day_range: [number, number] }
  | { type: 'data'; condition: string };

interface WorldPressure {
  id: string;
  trigger: PressureTrigger;
  description: string;
  narrative_hint: string;
  duration_heartbeats: number;
}

export interface WorldStateSnapshot {
  current_time: string;
  time_of_day: string;
  season: string;
  weather: string;
  game_day: number;
  heartbeat_count: number;
}

// ── Pressure Catalog ──

const PRESSURE_CATALOG: WorldPressure[] = [
  {
    id: 'market_day',
    trigger: { type: 'recurring', every_n_game_days: 3 },
    description: 'Market day in Arboria',
    narrative_hint:
      'Stalls are busy, trade is active, agents visit the market district.',
    duration_heartbeats: 4,
  },
  {
    id: 'heavy_storm',
    trigger: { type: 'weather', condition: 'heavy_rain', min_duration_heartbeats: 2 },
    description: 'Heavy storm batters the settlement',
    narrative_hint:
      'Agents shelter indoors, worry about flooding, help each other.',
    duration_heartbeats: 3,
  },
  {
    id: 'harvest_festival',
    trigger: { type: 'season_event', season: 'autumn', game_day_range: [18, 22] },
    description: 'Harvest festival preparations',
    narrative_hint:
      'Decorations, cooking, excitement. Agents prepare for the gathering.',
    duration_heartbeats: 8,
  },
  {
    id: 'winter_approach',
    trigger: { type: 'season_event', season: 'autumn', game_day_range: [25, 28] },
    description: 'Winter preparations begin',
    narrative_hint:
      'Stockpiling, repairs, concern about cold. Urgency increases.',
    duration_heartbeats: 6,
  },
  {
    id: 'new_arrival',
    trigger: { type: 'data', condition: 'agent_registered_last_24h' },
    description: 'A new agent has arrived',
    narrative_hint:
      'Curiosity, gossip, welcoming. Existing agents react to the newcomer.',
    duration_heartbeats: 4,
  },
  {
    id: 'reputation_milestone',
    trigger: { type: 'data', condition: 'agent_crossed_600_or_800_reputation' },
    description: 'An agent reaches a milestone',
    narrative_hint:
      'Recognition, celebration, or jealousy depending on relationships.',
    duration_heartbeats: 2,
  },
  {
    id: 'quiet_morning',
    trigger: { type: 'weather', condition: 'clear', min_duration_heartbeats: 0 },
    description: 'Peaceful early morning',
    narrative_hint:
      'Slow start, coffee/tea, watching sunrise, gentle routines.',
    duration_heartbeats: 2,
  },
];

// ── World time helpers ──

const WORLD_EPOCH_MS = new Date('2026-01-01T00:00:00Z').getTime();
const DAY_CYCLE_MS = 24 * 60 * 1000; // 24 real minutes = 1 game day
const HEARTBEAT_INTERVAL_MS = 6 * 60 * 1000; // 6 real minutes

/** Derive game day number and time-of-day from real time. */
export function getWorldTimeInfo(): {
  game_day: number;
  heartbeat_count: number;
  normalized_time: number;
  time_of_day: string;
  current_time: string;
} {
  const now = Date.now();
  const elapsed = now - WORLD_EPOCH_MS;
  const game_day = Math.floor(elapsed / DAY_CYCLE_MS) + 1;
  const heartbeat_count = Math.floor(elapsed / HEARTBEAT_INTERVAL_MS);
  const normalized_time = (elapsed % DAY_CYCLE_MS) / DAY_CYCLE_MS;

  // Map normalized time (0–1) to 24h clock
  const totalMinutes = Math.floor(normalized_time * 24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const current_time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  let time_of_day: string;
  if (hours >= 6 && hours < 10) time_of_day = 'morning';
  else if (hours >= 10 && hours < 14) time_of_day = 'midday';
  else if (hours >= 14 && hours < 18) time_of_day = 'afternoon';
  else if (hours >= 18 && hours < 22) time_of_day = 'evening';
  else time_of_day = 'night';

  return { game_day, heartbeat_count, normalized_time, time_of_day, current_time };
}

// ── Trigger evaluation ──

function isRecurringActive(
  trigger: { every_n_game_days: number },
  gamDay: number,
): boolean {
  return gamDay % trigger.every_n_game_days === 0;
}

function isWeatherActive(
  trigger: { condition: string; min_duration_heartbeats: number },
  weather: string,
  timeOfDay: string,
): boolean {
  // Quiet morning only applies during morning hours with clear weather
  if (trigger.condition === 'clear' && trigger.min_duration_heartbeats === 0) {
    return weather === 'clear' && timeOfDay === 'morning';
  }
  return weather === trigger.condition;
}

function isSeasonEventActive(
  trigger: { season: string; game_day_range: [number, number] },
  season: string,
  gameDay: number,
): boolean {
  // game_day_range is within the season's ~28-day cycle
  const dayInSeason = ((gameDay - 1) % 28) + 1;
  return (
    season === trigger.season &&
    dayInSeason >= trigger.game_day_range[0] &&
    dayInSeason <= trigger.game_day_range[1]
  );
}

async function isDataConditionActive(
  condition: string,
  supabase: SupabaseClient,
): Promise<boolean> {
  if (condition === 'agent_registered_last_24h') {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('agents')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);
    return (count ?? 0) > 0;
  }

  if (condition === 'agent_crossed_600_or_800_reputation') {
    // Check if any agent has a reputation score that recently crossed 600 or 800
    const { data } = await supabase
      .from('agents')
      .select('reputation_score')
      .or('reputation_score.eq.600,reputation_score.eq.601,reputation_score.eq.800,reputation_score.eq.801');
    return (data?.length ?? 0) > 0;
  }

  return false;
}

// ── Public API ──

/**
 * Evaluates all pressure triggers against current world state
 * and returns the active pressures with their narrative hints.
 */
export async function getActivePressures(
  worldState: { season: string; weather: string; time_of_day: string; game_day: number },
  supabase: SupabaseClient,
): Promise<{ id: string; description: string; narrative_hint: string }[]> {
  const active: { id: string; description: string; narrative_hint: string }[] = [];

  for (const pressure of PRESSURE_CATALOG) {
    let isActive = false;

    switch (pressure.trigger.type) {
      case 'recurring':
        isActive = isRecurringActive(pressure.trigger, worldState.game_day);
        break;
      case 'weather':
        isActive = isWeatherActive(pressure.trigger, worldState.weather, worldState.time_of_day);
        break;
      case 'season_event':
        isActive = isSeasonEventActive(
          pressure.trigger,
          worldState.season,
          worldState.game_day,
        );
        break;
      case 'data':
        isActive = await isDataConditionActive(pressure.trigger.condition, supabase);
        break;
    }

    if (isActive) {
      active.push({
        id: pressure.id,
        description: pressure.description,
        narrative_hint: pressure.narrative_hint,
      });
    }
  }

  return active;
}
