/**
 * Season utilities — pure functions for season-based visual effects.
 * No state, no polling. Reads season value from WeatherEngine.
 */

export type Season = "spring" | "summer" | "autumn" | "winter";

/**
 * Returns a Phaser-compatible tint color for ground/foliage tiles
 * based on the current season.
 */
export function getSeasonTint(season: string): number {
  switch (season) {
    case "spring":
      return 0xe8f5e1; // light green
    case "summer":
      return 0xffffff; // no tint (full color)
    case "autumn":
      return 0xf5d4a0; // warm amber
    case "winter":
      return 0xd4e5f7; // cool blue-white
    default:
      return 0xffffff;
  }
}

/**
 * Returns an ambient light multiplier (0-1) for the given season.
 * Lower values = dimmer ambient light.
 */
export function getSeasonAmbientFactor(season: string): number {
  switch (season) {
    case "spring":
      return 0.95;
    case "summer":
      return 1.0;
    case "autumn":
      return 0.85;
    case "winter":
      return 0.75;
    default:
      return 1.0;
  }
}
