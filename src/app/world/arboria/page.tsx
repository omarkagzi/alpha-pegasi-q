"use client";

import { useEffect } from "react";
import { useWorldStore } from "@/stores/worldStore";

/**
 * /world/arboria — signals WorldCanvas to show the Arboria regional map.
 * The actual Phaser rendering is handled by WorldCanvas in the layout.
 * This page exists for direct URL navigation support.
 */
export default function ArboriaPage() {
  const activeView = useWorldStore((s) => s.activeView);
  const enterBiome = useWorldStore((s) => s.enterBiome);

  useEffect(() => {
    // If user navigates directly to /world/arboria, ensure Phaser shows
    if (activeView === "orbital") {
      enterBiome("temperate_deciduous_forest");
    }
  }, [activeView, enterBiome]);

  // No visible content — WorldCanvas + Phaser renders the biome view
  return null;
}
