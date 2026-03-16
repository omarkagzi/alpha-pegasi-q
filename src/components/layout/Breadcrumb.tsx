"use client";

import { useWorldStore } from "@/stores/worldStore";
import {
  BIOME_DISPLAY_NAMES,
  SETTLEMENT_DISPLAY_NAMES,
} from "@/lib/constants/displayNames";

/**
 * Breadcrumb — navigation trail: Alpha Pegasi q › Arboria › Market Town
 * Hidden in orbital view. Each segment is clickable.
 */
export default function Breadcrumb() {
  const activeView = useWorldStore((s) => s.activeView);
  const currentBiome = useWorldStore((s) => s.currentBiome);
  const currentSettlement = useWorldStore((s) => s.currentSettlement);
  const returnToOrbit = useWorldStore((s) => s.returnToOrbit);
  const returnToRegionMap = useWorldStore((s) => s.returnToRegionMap);

  // Hidden in orbital view
  if (activeView === "orbital") return null;

  const biomeName = currentBiome ? BIOME_DISPLAY_NAMES[currentBiome] || currentBiome : null;
  const settlementName = currentSettlement
    ? SETTLEMENT_DISPLAY_NAMES[currentSettlement] || currentSettlement
    : null;

  return (
    <nav className="absolute top-2 left-2 pointer-events-auto z-30">
      <ol className="flex items-center gap-1 text-xs font-mono">
        {/* Planet root */}
        <li>
          <button
            onClick={returnToOrbit}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Alpha Pegasi q
          </button>
        </li>

        {/* Biome */}
        {biomeName && (
          <>
            <li className="text-gray-600">›</li>
            <li>
              <button
                onClick={returnToRegionMap}
                className={`transition-colors ${
                  activeView === "region-map"
                    ? "text-green-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {biomeName}
              </button>
            </li>
          </>
        )}

        {/* Settlement */}
        {settlementName && activeView === "settlement" && (
          <>
            <li className="text-gray-600">›</li>
            <li className="text-amber-400">{settlementName}</li>
          </>
        )}
      </ol>
    </nav>
  );
}
