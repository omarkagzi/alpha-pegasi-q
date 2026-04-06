import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type ActiveView = "orbital" | "region-map" | "settlement";

interface ChatState {
  agentId: string;
  agentName: string;
  sessionId: string | null;
}

/** Client-side world event shape (matches agent_events table) */
export interface WorldEvent {
  id: string;
  event_type: "conversation" | "activity" | "observation" | "trade" | "reaction";
  event_category: string;
  involved_agents: string[];
  location: string | null;
  description: string;
  dialogue: string | null;
  created_at: string;
}

const MAX_WORLD_EVENTS = 50;

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

  /** Active chat session (null when not chatting) */
  activeChat: ChatState | null;

  /** Recent world events from heartbeat broadcasts */
  worldEvents: WorldEvent[];

  // Actions
  enterBiome: (biomeId: string) => void;
  enterSettlement: (settlementId: string) => void;
  returnToRegionMap: () => void;
  returnToOrbit: () => void;
  setNearbyAgent: (agent: { id: string; name: string } | null) => void;
  setWeather: (weather: string, season: string) => void;
  setTimeState: (normalizedTime: number, label: string) => void;
  openChat: (agentId: string, agentName: string) => void;
  closeChat: () => void;
  setChatSessionId: (sessionId: string) => void;
  addWorldEvents: (events: WorldEvent[]) => void;
}

export const useWorldStore = create<WorldState>()(subscribeWithSelector((set) => ({
  activeView: "orbital",
  currentBiome: null,
  currentSettlement: null,
  nearbyAgent: null,
  normalizedTime: 0,
  weather: "clear",
  season: "autumn",
  timeOfDay: "Day",
  activeChat: null,
  worldEvents: [],

  enterBiome: (biomeId) =>
    set({
      activeView: "settlement",
      currentBiome: biomeId,
      currentSettlement: "arboria_market_town",
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

  openChat: (agentId, agentName) =>
    set({
      activeChat: { agentId, agentName, sessionId: null },
    }),

  closeChat: () => set({ activeChat: null }),

  setChatSessionId: (sessionId) =>
    set((state) => ({
      activeChat: state.activeChat
        ? { ...state.activeChat, sessionId }
        : null,
    })),

  addWorldEvents: (events) =>
    set((state) => {
      // Deduplicate by id, newest first
      const existing = new Set(state.worldEvents.map((e) => e.id));
      const newEvents = events.filter((e) => !existing.has(e.id));
      if (newEvents.length === 0) return state;
      const combined = [...newEvents, ...state.worldEvents].slice(0, MAX_WORLD_EVENTS);
      return { worldEvents: combined };
    }),
})));
