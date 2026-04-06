"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useWorldStore, ActiveView } from "@/stores/worldStore";
import type { PhaserCanvasHandle } from "@/components/settlement/PhaserCanvas";

// Dynamic imports — no SSR for canvas components
const PlanetCanvas = dynamic(() => import("@/components/planet/PlanetCanvas"), {
  ssr: false,
});
const PhaserCanvas = dynamic(() => import("@/components/settlement/PhaserCanvas"), {
  ssr: false,
});

/**
 * WorldCanvas — owns both the Three.js (orbital) and Phaser 3 (2D game) renderers.
 * Per PRD §8.2: both are initialized on load, neither is destroyed.
 * Manages fade transitions between them based on worldStore.activeView.
 */
export default function WorldCanvas() {
  const activeView = useWorldStore((s) => s.activeView);
  const phaserRef = useRef<PhaserCanvasHandle>(null);

  // Fade state: controls opacity transitions between canvases
  const [threeOpacity, setThreeOpacity] = useState(1);
  const [phaserOpacity, setPhaserOpacity] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const prevView = useRef<ActiveView>("orbital");

  const fadeTo = useCallback(
    (target: "three" | "phaser", duration = 600) => {
      setTransitioning(true);
      const start = performance.now();

      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-in-out quad
        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        if (target === "phaser") {
          setThreeOpacity(1 - eased);
          setPhaserOpacity(eased);
        } else {
          setThreeOpacity(eased);
          setPhaserOpacity(1 - eased);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setTransitioning(false);
        }
      };

      requestAnimationFrame(animate);
    },
    []
  );

  // React to view changes
  useEffect(() => {
    if (activeView === prevView.current) return;

    const goingToPhaser =
      activeView === "region-map" || activeView === "settlement";
    const wasInPhaser =
      prevView.current === "region-map" || prevView.current === "settlement";

    if (goingToPhaser && !wasInPhaser) {
      // Orbital → Phaser: resume Phaser, fade to it
      phaserRef.current?.resume();
      // Ensure the correct Phaser scene is active based on activeView
      const game = phaserRef.current?.getGame();
      if (game && activeView === "settlement") {
        const settlement = game.scene.getScene("SettlementScene");
        if (settlement && !settlement.scene.isActive()) {
          game.scene.start("SettlementScene");
        }
      }
      fadeTo("phaser");
    } else if (!goingToPhaser && wasInPhaser) {
      // Phaser → Orbital: fade to Three.js, then pause Phaser
      fadeTo("three");
      setTimeout(() => phaserRef.current?.pause(), 650);
    }
    // Phaser scene switches (region-map ↔ settlement) are handled internally
    // by Phaser — no canvas-level transition needed.

    prevView.current = activeView;
  }, [activeView, fadeTo]);

  // Initially pause Phaser once boot completes (event-driven, not timeout)
  useEffect(() => {
    const checkAndPause = () => {
      const game = phaserRef.current?.getGame();
      if (!game) return;

      // Check if boot already completed
      if (game.registry.get("bootComplete")) {
        phaserRef.current?.pause();
        return;
      }

      // Wait for bootComplete event
      game.events.once("bootComplete", () => {
        // Only pause if we're still in orbital view
        if (useWorldStore.getState().activeView === "orbital") {
          phaserRef.current?.pause();
        }
      });
    };

    // Brief delay to let Phaser.Game instance initialize
    const timer = setTimeout(checkAndPause, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full absolute inset-0 bg-black">
      {/* Three.js layer (orbital view) */}
      <div
        className="absolute inset-0"
        style={{
          opacity: threeOpacity,
          pointerEvents: activeView === "orbital" ? "auto" : "none",
          zIndex: activeView === "orbital" ? 2 : 1,
        }}
      >
        <PlanetCanvas />
      </div>

      {/* Phaser 3 layer (regional map + settlement) */}
      <div
        className="absolute inset-0"
        style={{
          opacity: phaserOpacity,
          pointerEvents:
            activeView === "region-map" || activeView === "settlement"
              ? "auto"
              : "none",
          zIndex:
            activeView === "region-map" || activeView === "settlement" ? 2 : 1,
        }}
      >
        <PhaserCanvas ref={phaserRef} />
      </div>

      {/* Transition overlay — prevents interaction during fade */}
      {transitioning && (
        <div className="absolute inset-0 z-10 pointer-events-auto" />
      )}
    </div>
  );
}
