import Phaser from "phaser";
import { WeatherEngine } from "@/engine/region/weatherEngine";

/**
 * WeatherEffects — manages visual weather overlays and particle emitters.
 * Works in both RegionMapScene and SettlementScene.
 * All overlays use scrollFactor(0) and high depth (900+).
 */
export class WeatherEffects {
  private scene: Phaser.Scene;
  private weatherEngine: WeatherEngine;
  private currentWeather = "";

  // Effect layers
  private tintOverlay: Phaser.GameObjects.Rectangle | null = null;
  private rainEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null =
    null;
  private mistOverlay: Phaser.GameObjects.Rectangle | null = null;

  constructor(scene: Phaser.Scene, weatherEngine: WeatherEngine) {
    this.scene = scene;
    this.weatherEngine = weatherEngine;
  }

  /** Call every frame from scene.update() */
  update(): void {
    const weather = this.weatherEngine.getCurrentWeather();

    // Only rebuild effects if weather actually changed
    if (weather !== this.currentWeather) {
      this.clearEffects();
      this.currentWeather = weather;
      this.applyWeather(weather);
    }

    // Animate mist oscillation
    if (this.mistOverlay && this.currentWeather === "mist") {
      const osc = Math.sin(this.scene.time.now / 2000);
      this.mistOverlay.setAlpha(0.2 + osc * 0.1); // 0.1 → 0.3 range
    }
  }

  destroy(): void {
    this.clearEffects();
  }

  private applyWeather(weather: string): void {
    const cam = this.scene.cameras.main;

    switch (weather) {
      case "clear":
        // No overlay needed
        break;

      case "light_rain":
        // Blue tint overlay at 8% alpha
        this.tintOverlay = this.scene.add
          .rectangle(cam.centerX, cam.centerY, cam.width, cam.height, 0x4466aa, 0.08)
          .setScrollFactor(0)
          .setDepth(900)
          .setOrigin(0.5);

        // Rain particle emitter — small blue drops falling diagonally
        this.rainEmitter = this.scene.add.particles(0, 0, "__DEFAULT", {
          x: { min: 0, max: cam.width },
          y: -4,
          lifespan: 600,
          speedY: { min: 120, max: 180 },
          speedX: { min: -20, max: -40 },
          scale: { start: 0.3, end: 0.1 },
          alpha: { start: 0.6, end: 0 },
          tint: 0x6688cc,
          quantity: 2,
          frequency: 50,
          emitting: true,
        });
        this.rainEmitter.setScrollFactor(0).setDepth(910);
        break;

      case "overcast":
        // Dark gray overlay at 20% alpha
        this.tintOverlay = this.scene.add
          .rectangle(cam.centerX, cam.centerY, cam.width, cam.height, 0x333344, 0.2)
          .setScrollFactor(0)
          .setDepth(900)
          .setOrigin(0.5);
        break;

      case "mist":
        // White overlay with alpha oscillation (handled in update)
        this.mistOverlay = this.scene.add
          .rectangle(cam.centerX, cam.centerY, cam.width, cam.height, 0xcccccc, 0.15)
          .setScrollFactor(0)
          .setDepth(900)
          .setOrigin(0.5);
        break;

      default:
        // Unknown weather — no effects
        break;
    }
  }

  private clearEffects(): void {
    if (this.tintOverlay) {
      this.tintOverlay.destroy();
      this.tintOverlay = null;
    }
    if (this.rainEmitter) {
      this.rainEmitter.destroy();
      this.rainEmitter = null;
    }
    if (this.mistOverlay) {
      this.mistOverlay.destroy();
      this.mistOverlay = null;
    }
  }
}
