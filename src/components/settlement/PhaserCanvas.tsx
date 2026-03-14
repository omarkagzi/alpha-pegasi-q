"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Phaser from "phaser";
import { createPhaserConfig } from "@/engine/settlement/phaserConfig";

export interface PhaserCanvasHandle {
  getGame: () => Phaser.Game | null;
  pause: () => void;
  resume: () => void;
}

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
    if (!containerRef.current || gameRef.current) return;

    const config = createPhaserConfig(containerRef.current);
    gameRef.current = new Phaser.Game(config);

    // Don't destroy on unmount — game persists per PRD §8.2
    // Cleanup only on full app teardown
    return () => {
      // Intentionally not destroying the game here.
      // The WorldCanvas wrapper manages the lifecycle.
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
