"use client";

import { useState } from "react";
import { useWorldStore, type WorldEvent } from "@/stores/worldStore";
import { sanitizeEventText } from "@/lib/ai/sanitize";

/**
 * Format a timestamp as a relative time string (e.g., "2 min ago").
 */
function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr ago`;
}

/**
 * Group events into "Recent" and "Earlier" buckets.
 * Recent = last 10 real minutes, Earlier = rest.
 */
function groupEvents(events: WorldEvent[]): { recent: WorldEvent[]; earlier: WorldEvent[] } {
  const cutoff = Date.now() - 10 * 60_000;
  const recent: WorldEvent[] = [];
  const earlier: WorldEvent[] = [];
  for (const e of events) {
    if (new Date(e.created_at).getTime() >= cutoff) {
      recent.push(e);
    } else {
      earlier.push(e);
    }
  }
  return { recent, earlier };
}

/**
 * ActivityFeed — toggleable HUD panel showing recent world events as readable text.
 * Accessible via a scroll icon in the SettlementHUD area.
 */
export default function ActivityFeed() {
  const [isOpen, setIsOpen] = useState(false);
  const activeView = useWorldStore((s) => s.activeView);
  const worldEvents = useWorldStore((s) => s.worldEvents);
  const weather = useWorldStore((s) => s.weather);
  const season = useWorldStore((s) => s.season);
  const timeOfDay = useWorldStore((s) => s.timeOfDay);

  if (activeView !== "settlement") return null;

  // Toggle button (always visible)
  const toggleButton = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="absolute top-2 right-[140px] z-30 pointer-events-auto bg-black/60 border border-gray-700 rounded px-2 py-1.5 font-mono text-xs text-amber-400 hover:border-amber-700/50 hover:text-amber-300 transition-colors"
      title="Town Bulletin"
    >
      <span className="text-sm">&#x1F4DC;</span>
    </button>
  );

  if (!isOpen) return toggleButton;

  const { recent, earlier } = groupEvents(worldEvents);

  return (
    <>
      {toggleButton}

      {/* Panel */}
      <div className="absolute top-12 right-2 w-[320px] max-h-[60vh] z-30 pointer-events-auto flex flex-col bg-black/85 border border-amber-700/40 rounded-lg backdrop-blur-sm animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-amber-700/30">
          <span className="font-mono text-amber-400 font-bold text-sm">
            Town Bulletin
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-300 font-mono text-xs px-1.5 py-0.5 border border-gray-700 rounded hover:border-gray-500 transition-colors"
          >
            close
          </button>
        </div>

        {/* Context bar */}
        <div className="px-4 py-1.5 text-[10px] font-mono text-gray-500 border-b border-gray-800">
          {timeOfDay} &mdash; {season.charAt(0).toUpperCase() + season.slice(1)} &mdash;{" "}
          {weather.replace(/_/g, " ")}
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-thin">
          {worldEvents.length === 0 && (
            <div className="text-gray-600 text-xs font-mono text-center py-8">
              No recent activity in the settlement.
            </div>
          )}

          {recent.map((event) => (
            <EventEntry key={event.id} event={event} />
          ))}

          {earlier.length > 0 && (
            <>
              <div className="text-center text-[10px] text-gray-600 font-mono py-1">
                &mdash; &mdash; Earlier today &mdash; &mdash;
              </div>
              {earlier.map((event) => (
                <EventEntry key={event.id} event={event} />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function EventEntry({ event }: { event: WorldEvent }) {
  const cleanDesc = sanitizeEventText(event.description);
  const cleanDialogue = event.dialogue ? sanitizeEventText(event.dialogue) : null;

  if (!cleanDesc) return null; // Skip fully-corrupt entries

  return (
    <div className="text-xs leading-relaxed font-sans text-gray-300">
      <span className="text-gray-500 mr-1">*</span>
      {cleanDesc}
      {cleanDialogue && (
        <span className="text-amber-400/70 italic">
          {" "}&ldquo;{cleanDialogue.split("\n")[0]}&rdquo;
        </span>
      )}
      <span className="text-gray-600 text-[10px] ml-2 whitespace-nowrap">
        &mdash; {relativeTime(event.created_at)}
      </span>
    </div>
  );
}
