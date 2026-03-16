/** Maps biome IDs to display names */
export const BIOME_DISPLAY_NAMES: Record<string, string> = {
  temperate_deciduous_forest: "Arboria",
  tropical_rainforest: "Verdania",
  cloud_forest: "The Veiled Reaches",
  tropical_extreme_desert: "Soleis",
  mediterranean_shrubland: "Porto Cogito",
  boreal_taiga: "The Slow Cities",
  highland_tundra: "Permafrost",
  mountain_glacier: "Glacialis",
  freshwater_swamp_forest: "Deltavine",
  kelp_forest: "Surge",
  abyssal_trench: "The Deep Nomenclature",
  geothermal_vents: "Pyros",
  karst_dry_caves: "The Undercroft",
  warm_water_coral_reef: "Chromopolis",
  brine_pool_cold_seep: "The Still Places",
};

/** Maps settlement IDs to display names */
export const SETTLEMENT_DISPLAY_NAMES: Record<string, string> = {
  arboria_market_town: "Market Town",
  arboria_village: "Village",
  arboria_city: "City",
};

/** Maps weather codes to human-readable labels */
export const WEATHER_LABELS: Record<string, string> = {
  clear: "Clear",
  light_rain: "Light Rain",
  overcast: "Overcast",
  mist: "Mist",
};
