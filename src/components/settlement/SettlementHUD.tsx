"use client";

import { useWorldStore } from "@/stores/worldStore";
import {
  SETTLEMENT_DISPLAY_NAMES,
  WEATHER_LABELS,
} from "@/lib/constants/displayNames";

/** Weather icons (text-based for pixel aesthetic) */
const WEATHER_ICONS: Record<string, string> = {
  clear: "☀",
  light_rain: "🌧",
  overcast: "☁",
  mist: "🌫",
};

/**
 * Converts normalized time (0-1) to a 24-hour clock string.
 * 0.0 = 00:00, 0.5 = 12:00, 1.0 = 24:00
 */
function formatWorldClock(normalizedTime: number): string {
  const totalMinutes = Math.floor(normalizedTime * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

/**
 * SettlementHUD — shows current time, weather, location, and map hint.
 * Only visible when in settlement view.
 */
export default function SettlementHUD() {
  const activeView = useWorldStore((s) => s.activeView);
  const normalizedTime = useWorldStore((s) => s.normalizedTime);
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const weather = useWorldStore((s) => s.weather);
  const season = useWorldStore((s) => s.season);
  const currentSettlement = useWorldStore((s) => s.currentSettlement);

  if (activeView !== "settlement") return null;

  const settlementName = currentSettlement
    ? SETTLEMENT_DISPLAY_NAMES[currentSettlement] || currentSettlement
    : "Unknown";

  const clockStr = formatWorldClock(normalizedTime);
  const weatherLabel = WEATHER_LABELS[weather] || weather;
  const weatherIcon = WEATHER_ICONS[weather] || "?";

  return (
    <div className="absolute top-2 right-2 pointer-events-auto z-30">
      <div className="bg-black/60 border border-gray-700 rounded px-3 py-2 font-mono text-xs space-y-1 min-w-[120px]">
        {/* Location */}
        <div className="text-amber-400 font-bold text-center border-b border-gray-700 pb-1">
          {settlementName}
        </div>

        {/* Time */}
        <div className="flex justify-between items-center text-gray-300">
          <span>{clockStr}</span>
          <span className="text-gray-500 text-[10px]">{timeOfDay}</span>
        </div>

        {/* Weather */}
        <div className="flex justify-between items-center text-gray-300">
          <span>
            {weatherIcon} {weatherLabel}
          </span>
          <span className="text-gray-500 text-[10px] capitalize">{season}</span>
        </div>

        {/* Map hint */}
        <div className="text-gray-600 text-center text-[10px] border-t border-gray-700 pt-1">
          M = Map
        </div>
      </div>
    </div>
  );
}
