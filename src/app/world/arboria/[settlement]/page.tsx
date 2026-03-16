"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useWorldStore } from "@/stores/worldStore";

/**
 * Settlement route page — handles direct URL navigation to a settlement.
 * e.g. /world/arboria/market-town
 *
 * If the user navigates directly (not via Phaser scene transition),
 * this signals the worldStore to enter the correct view.
 * Renders nothing — Phaser handles all visuals.
 */
export default function SettlementPage() {
  const params = useParams();
  const hasRun = useRef(false);

  useEffect(() => {
    // Run once on mount only — avoid re-triggering on store changes
    if (hasRun.current) return;
    hasRun.current = true;

    const settlementSlug = params.settlement as string;
    const settlementId =
      settlementSlug === "market-town"
        ? "arboria_market_town"
        : `arboria_${settlementSlug.replace(/-/g, "_")}`;

    const { activeView, enterBiome, enterSettlement } =
      useWorldStore.getState();

    // If arriving from orbital (direct URL navigation), set up the full path
    if (activeView === "orbital") {
      enterBiome("temperate_deciduous_forest");
    }
    if (activeView !== "settlement") {
      enterSettlement(settlementId);
    }
  }, [params.settlement]);

  return null;
}
