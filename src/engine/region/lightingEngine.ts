import Phaser from "phaser";
import {
  simulatePlanetTime,
  fetchServerTime,
  type ServerTimeRef,
} from "@/engine/planet/planetTime";
import { useWorldStore } from "@/stores/worldStore";

/**
 * LightingEngine — per-frame day/night cycle overlay for Phaser scenes.
 *
 * Creates a full-screen rectangle at high depth with scrollFactor(0).
 * Each frame, computes the current normalized time (0-1) and maps it
 * to a tint color + alpha following the PRD §3.3 day/night spec:
 *
 *   0.00–0.25  Night   dark blue, 60% alpha
 *   0.25–0.35  Dawn    gradient blue → warm yellow
 *   0.35–0.65  Day     slight warm yellow, 5% alpha
 *   0.65–0.75  Dusk    gradient warm → orange → blue
 *   0.75–1.00  Night   dark blue, 60% alpha
 */
export class LightingEngine {
  private overlay: Phaser.GameObjects.Rectangle;
  private serverRef: ServerTimeRef = {
    normalizedTime: null,
    fetchedAt: null,
  };
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private lastStoreWrite = 0;

  constructor(scene: Phaser.Scene) {
    // Full-screen overlay covering the entire viewport
    const cam = scene.cameras.main;
    this.overlay = scene.add
      .rectangle(cam.centerX, cam.centerY, cam.width, cam.height, 0x000000, 0)
      .setScrollFactor(0)
      .setDepth(950)
      .setOrigin(0.5);

    // Initial server time sync
    this.syncServerTime();

    // Re-sync every 5 minutes
    this.syncTimer = setInterval(() => {
      this.syncServerTime();
    }, 5 * 60 * 1000);
  }

  /** Call every frame from scene.update() */
  update(): void {
    const t = simulatePlanetTime(this.serverRef);
    const { color, alpha, label } = this.computeLighting(t);

    this.overlay.setFillStyle(color, alpha);

    // Throttle worldStore writes to once per second
    const now = Date.now();
    if (now - this.lastStoreWrite > 1000) {
      this.lastStoreWrite = now;
      useWorldStore.getState().setTimeState(t, label);
    }
  }

  destroy(): void {
    if (this.syncTimer !== null) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.overlay) {
      this.overlay.destroy();
    }
  }

  private computeLighting(t: number): {
    color: number;
    alpha: number;
    label: string;
  } {
    // Night: 0.00–0.25
    if (t < 0.25) {
      return { color: 0x0a1a3a, alpha: 0.6, label: "Night" };
    }

    // Dawn: 0.25–0.35 (gradient from night blue to warm yellow)
    if (t < 0.35) {
      const progress = (t - 0.25) / 0.1; // 0→1
      const alpha = 0.6 - progress * 0.55; // 0.6 → 0.05
      const color = this.lerpColor(0x0a1a3a, 0xf5d08a, progress);
      return { color, alpha, label: "Dawn" };
    }

    // Day: 0.35–0.65 (slight warm yellow tint)
    if (t < 0.65) {
      return { color: 0xf5d08a, alpha: 0.05, label: "Day" };
    }

    // Dusk: 0.65–0.75 (gradient from warm to orange to blue)
    if (t < 0.75) {
      const progress = (t - 0.65) / 0.1; // 0→1
      const alpha = 0.05 + progress * 0.55; // 0.05 → 0.6
      const color = this.lerpColor(0xf5a040, 0x0a1a3a, progress);
      return { color, alpha, label: "Dusk" };
    }

    // Night: 0.75–1.00
    return { color: 0x0a1a3a, alpha: 0.6, label: "Night" };
  }

  /** Linear interpolation between two RGB hex colors */
  private lerpColor(from: number, to: number, t: number): number {
    const r1 = (from >> 16) & 0xff;
    const g1 = (from >> 8) & 0xff;
    const b1 = from & 0xff;
    const r2 = (to >> 16) & 0xff;
    const g2 = (to >> 8) & 0xff;
    const b2 = to & 0xff;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
  }

  private async syncServerTime(): Promise<void> {
    const result = await fetchServerTime();
    if (result) {
      this.serverRef.normalizedTime = result.normalizedTime;
      this.serverRef.fetchedAt = result.fetchedAt;
    }
  }
}
