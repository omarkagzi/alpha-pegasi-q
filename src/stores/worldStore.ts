import { create } from "zustand";

export type ActiveView = "orbital" | "region-map" | "settlement";

interface WorldState {
  /** Which renderer / view is currently active */
  activeView: ActiveView;
  /** The biome currently being viewed (null when in orbital view) */
  currentBiome: string | null;
  /** The settlement currently being viewed (null when not in settlement) */
  currentSettlement: string | null;
  /** Agent near the player (for interaction prompt) */
  nearbyAgent: { id: string; name: string } | null;

  /** Day/night normalized time (0-1, one full cycle = 24 real minutes) */
  normalizedTime: number;
  /** Current weather condition for the active biome */
  weather: string;
  /** Current season for the active biome */
  season: string;
  /** Human-readable time-of-day label */
  timeOfDay: string;

  // Actions
  enterBiome: (biomeId: string) => void;
  enterSettlement: (settlementId: string) => void;
  returnToRegionMap: () => void;
  returnToOrbit: () => void;
  setNearbyAgent: (agent: { id: string; name: string } | null) => void;
  setWeather: (weather: string, season: string) => void;
  setTimeState: (normalizedTime: number, label: string) => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  activeView: "orbital",
  currentBiome: null,
  currentSettlement: null,
  nearbyAgent: null,
  normalizedTime: 0,
  weather: "clear",
  season: "autumn",
  timeOfDay: "Day",

  enterBiome: (biomeId) =>
    set({
      activeView: "region-map",
      currentBiome: biomeId,
      currentSettlement: null,
      nearbyAgent: null,
    }),

  enterSettlement: (settlementId) =>
    set({
      activeView: "settlement",
      currentSettlement: settlementId,
      nearbyAgent: null,
    }),

  returnToRegionMap: () =>
    set({
      activeView: "region-map",
      currentSettlement: null,
      nearbyAgent: null,
    }),

  returnToOrbit: () =>
    set({
      activeView: "orbital",
      currentBiome: null,
      currentSettlement: null,
      nearbyAgent: null,
    }),

  setNearbyAgent: (agent) => set({ nearbyAgent: agent }),

  setWeather: (weather, season) => set({ weather, season }),

  setTimeState: (normalizedTime, label) =>
    set({ normalizedTime, timeOfDay: label }),
}));
