"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Phaser from "phaser";
import { createPhaserConfig } from "@/engine/settlement/phaserConfig";

export interface PhaserCanvasHandle {
  getGame: () => Phaser.Game | null;
  pause: () => void;
  resume: () => void;
}

// Module-level singleton — prevents double-init in React StrictMode
let phaserGameInstance: Phaser.Game | null = null;

/**
 * PhaserCanvas — mounts and owns the Phaser.Game instance.
 * The game is created once on mount and never destroyed (per PRD §8.2).
 * Exposes pause/resume methods for the WorldCanvas orchestrator.
 */
const PhaserCanvas = forwardRef<PhaserCanvasHandle>(function PhaserCanvas(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useImperativeHandle(ref, () => ({
    getGame: () => gameRef.current,
    pause: () => {
      if (gameRef.current) {
        gameRef.current.scene.scenes.forEach((scene) => {
          if (scene.scene.isActive()) {
            scene.scene.pause();
          }
        });
        gameRef.current.loop.sleep();
      }
    },
    resume: () => {
      if (gameRef.current) {
        gameRef.current.loop.wake();
        gameRef.current.scene.scenes.forEach((scene) => {
          if (scene.scene.isPaused()) {
            scene.scene.resume();
          }
        });
      }
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    // Reuse existing singleton if available (StrictMode remount)
    if (phaserGameInstance) {
      gameRef.current = phaserGameInstance;
      // Re-parent the canvas if needed
      const canvas = phaserGameInstance.canvas;
      if (canvas && canvas.parentElement !== containerRef.current) {
        containerRef.current.appendChild(canvas);
      }
      return;
    }

    const config = createPhaserConfig(containerRef.current);
    phaserGameInstance = new Phaser.Game(config);
    gameRef.current = phaserGameInstance;

    // Don't destroy on unmount — game persists per PRD §8.2
    return () => {
      // Only null the local ref, not the singleton
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
});

export default PhaserCanvas;
