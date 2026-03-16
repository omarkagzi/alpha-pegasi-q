import { supabaseAnon } from "@/lib/supabase/anonClient";
import { useWorldStore } from "@/stores/worldStore";

/**
 * WeatherEngine — polls Supabase world_state for current weather & season.
 * Designed as a singleton stored on the Phaser game registry so both
 * RegionMapScene and SettlementScene share it across transitions.
 *
 * Usage:
 *   // In a Phaser scene's create():
 *   let engine = this.game.registry.get("weatherEngine") as WeatherEngine | undefined;
 *   if (!engine) {
 *     engine = new WeatherEngine("temperate_deciduous_forest");
 *     this.game.registry.set("weatherEngine", engine);
 *   }
 *   engine.start();
 */
export class WeatherEngine {
  private biome: string;
  private weather = "clear";
  private season = "autumn";
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(biome: string) {
    this.biome = biome;
  }

  /** Start polling Supabase every 60 seconds. Idempotent. */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    // Immediate first fetch
    await this.fetchWeather();

    // Poll every 60s
    this.pollTimer = setInterval(() => {
      this.fetchWeather();
    }, 60_000);
  }

  /** Stop polling. */
  stop(): void {
    this.running = false;
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  getCurrentWeather(): string {
    return this.weather;
  }

  getCurrentSeason(): string {
    return this.season;
  }

  private async fetchWeather(): Promise<void> {
    try {
      const { data, error } = await supabaseAnon
        .from("world_state")
        .select("weather, season")
        .eq("biome", this.biome)
        .single();

      if (error || !data) {
        console.warn("[WeatherEngine] Failed to fetch weather:", error?.message);
        return;
      }

      this.weather = data.weather ?? "clear";
      this.season = data.season ?? "autumn";

      // Push to Zustand store for React HUD consumption
      useWorldStore.getState().setWeather(this.weather, this.season);
    } catch (err) {
      console.warn("[WeatherEngine] Network error:", err);
    }
  }
}
