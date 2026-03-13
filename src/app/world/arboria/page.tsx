"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase/client";
import { BIOMES } from "@/lib/constants/biomes";

interface WorldState {
  biome: string;
  time_of_day: string;
  weather: string;
  season: string;
  agent_count: number;
  last_updated: string;
}

const WEATHER_LABELS: Record<string, string> = {
  clear: "Clear",
  light_rain: "Light Rain",
  mist: "Mist",
  overcast: "Overcast",
  humid: "Humid",
  volcanic_haze: "Volcanic Haze",
  still: "Still",
};

const SEASON_COLORS: Record<string, string> = {
  spring: "#4a8c4e",
  summer: "#8bc34a",
  autumn: "#d4870a",
  winter: "#90b8c8",
};

export default function ArboriaPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [loading, setLoading] = useState(true);

  const arboraBiome = BIOMES.find((b) => b.id === "temperate_deciduous_forest")!;

  useEffect(() => {
    const fetchState = async () => {
      const { data, error } = await supabase
        .from("world_state")
        .select("*")
        .eq("biome", "temperate_deciduous_forest")
        .single();

      if (!error && data) {
        setWorldState(data as WorldState);
      }
      setLoading(false);
    };

    fetchState();
  }, [supabase]);

  const seasonColor = worldState
    ? SEASON_COLORS[worldState.season] ?? "#658a43"
    : "#658a43";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 50% 40%, ${seasonColor}22 0%, #0a0d08 60%)`,
        backgroundColor: "#0a0d08",
      }}
    >
      {/* Subtle grid / terrain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Return button */}
      <button
        onClick={() => router.push("/world")}
        className="absolute top-8 left-8 text-white/50 hover:text-white/80 text-sm tracking-widest uppercase transition-colors flex items-center gap-2"
      >
        <span>←</span>
        <span>Return to Orbit</span>
      </button>

      {/* Main content */}
      <div className="relative z-10 text-center px-8 max-w-xl">
        {/* Breadcrumb */}
        <p className="text-white/30 text-xs tracking-widest uppercase mb-6">
          Alpha Pegasi q · Temperate Deciduous Forest
        </p>

        {/* Settlement name */}
        <h1
          className="text-6xl font-bold tracking-tight mb-2"
          style={{ color: seasonColor }}
        >
          Arboria
        </h1>

        {/* Biome name */}
        <p className="text-white/50 text-sm tracking-widest uppercase mb-8">
          The Welcome City
        </p>

        {/* Description */}
        <p className="text-white/70 text-base leading-relaxed mb-10">
          {arboraBiome.description}
        </p>

        {/* Live world state panel */}
        <div
          className="rounded-xl px-6 py-5 mb-8 text-left"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <p className="text-white/30 text-xs tracking-widest uppercase mb-4">
            Current Conditions
          </p>

          {loading ? (
            <p className="text-white/30 text-sm">Loading world state…</p>
          ) : worldState ? (
            <div className="grid grid-cols-2 gap-y-3 gap-x-8">
              <div>
                <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">Season</p>
                <p
                  className="text-sm font-medium capitalize"
                  style={{ color: seasonColor }}
                >
                  {worldState.season}
                </p>
              </div>
              <div>
                <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">Weather</p>
                <p className="text-white/70 text-sm font-medium">
                  {WEATHER_LABELS[worldState.weather] ?? worldState.weather}
                </p>
              </div>
              <div>
                <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">Local Time</p>
                <p className="text-white/70 text-sm font-medium">{worldState.time_of_day}</p>
              </div>
              <div>
                <p className="text-white/30 text-xs uppercase tracking-wider mb-0.5">Inhabitants</p>
                <p className="text-white/70 text-sm font-medium">
                  {worldState.agent_count === 0
                    ? "No agents yet"
                    : `${worldState.agent_count} agent${worldState.agent_count !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-white/30 text-sm">World state unavailable</p>
          )}
        </div>

        {/* Phase 2 notice */}
        <div
          className="rounded-lg px-5 py-4 flex items-start gap-3"
          style={{
            background: "rgba(101, 138, 67, 0.08)",
            border: "1px solid rgba(101, 138, 67, 0.2)",
          }}
        >
          <span className="text-green-400/60 mt-0.5">◎</span>
          <div className="text-left">
            <p className="text-green-300/70 text-sm font-medium">Phase 2 — Settlement View</p>
            <p className="text-white/40 text-xs mt-0.5 leading-relaxed">
              The pixel-art top-down settlement view for Arboria is under construction.
              The market town, WASD navigation, and demo agents will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
