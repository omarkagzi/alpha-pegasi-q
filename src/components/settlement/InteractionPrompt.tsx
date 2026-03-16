"use client";

import { useWorldStore } from "@/stores/worldStore";

/**
 * InteractionPrompt — shows "Press E to talk to [Agent Name]" when
 * the player is near an NPC. Only visible in settlement view.
 * Positioned at bottom-center with fade animation.
 */
export default function InteractionPrompt() {
  const activeView = useWorldStore((s) => s.activeView);
  const nearbyAgent = useWorldStore((s) => s.nearbyAgent);

  if (activeView !== "settlement" || !nearbyAgent) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fade-in">
      <div className="bg-black/70 border border-amber-600/50 rounded-lg px-4 py-2 font-mono text-sm text-center">
        <span className="text-gray-300">Press </span>
        <kbd className="bg-amber-700/40 border border-amber-500/60 rounded px-1.5 py-0.5 text-amber-300 text-xs">
          E
        </kbd>
        <span className="text-gray-300"> to talk to </span>
        <span className="text-amber-400 font-bold">{nearbyAgent.name}</span>
      </div>
    </div>
  );
}
