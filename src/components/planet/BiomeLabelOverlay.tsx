"use client";

import { Biome } from "@/types/biome";

interface BiomeLabelOverlayProps {
  biome: Biome | null;
  screenPos: { x: number; y: number } | null;
  notRealized?: boolean; // true when user clicked a non-realized biome
}

export default function BiomeLabelOverlay({
  biome,
  screenPos,
  notRealized,
}: BiomeLabelOverlayProps) {
  if (!biome || !screenPos) return null;

  // Offset the tooltip so it doesn't sit directly under the cursor
  const offsetX = 18;
  const offsetY = -12;

  // Keep tooltip from overflowing right/bottom edge
  const left = Math.min(screenPos.x + offsetX, window.innerWidth - 280);
  const top = Math.max(screenPos.y + offsetY, 8);

  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{ left, top }}
    >
      <div
        className="rounded-lg px-4 py-3 max-w-[260px]"
        style={{
          background: "rgba(0, 0, 0, 0.72)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Biome name */}
        <p className="text-white font-semibold text-sm tracking-wide leading-tight">
          {biome.settlementName}
        </p>

        {/* Settlement type */}
        <p className="text-white/50 text-xs mt-0.5 tracking-widest uppercase">
          {biome.name}
        </p>

        {/* Description */}
        <p className="text-white/70 text-xs mt-2 leading-relaxed">
          {biome.description}
        </p>

        {/* Status indicator */}
        <div className="mt-2 flex items-center gap-1.5">
          {biome.realized ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              <span className="text-green-400 text-xs">Click to enter</span>
            </>
          ) : notRealized ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 inline-block" />
              <span className="text-amber-300/70 text-xs">Settlement not yet realized</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-white/20 inline-block" />
              <span className="text-white/40 text-xs">Coming in a future phase</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
