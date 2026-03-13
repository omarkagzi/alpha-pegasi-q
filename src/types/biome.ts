export type SettlementScale = 'Village' | 'Town' | 'City';

export type BiomeId = 
  | 'tropical_rainforest'
  | 'cloud_forest'
  | 'tropical_extreme_desert'
  | 'mediterranean_shrubland'
  | 'boreal_taiga'
  | 'highland_tundra'
  | 'mountain_glacier'
  | 'freshwater_swamp_forest'
  | 'kelp_forest'
  | 'abyssal_trench'
  | 'geothermal_vents'
  | 'karst_dry_caves'
  | 'warm_water_coral_reef'
  | 'brine_pool_cold_seep'
  | 'temperate_deciduous_forest';

export interface BiomePosition {
  lat: number; // degrees, -90 to 90
  lon: number; // degrees, -180 to 180
}

export interface Biome {
  id: BiomeId;
  name: string;
  settlementName: string;
  description: string;
  color: string; // Used for rendering the planet regions
  position: BiomePosition; // Canonical center point on the sphere
  realized: boolean; // true only for biomes with a Phase 2+ implementation
}

export interface Settlement {
  id: string;
  biomeId: BiomeId;
  name: string;
  scale: SettlementScale;
  population: number;
}
