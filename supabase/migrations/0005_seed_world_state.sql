-- Seed initial world_state rows for all 15 canonical biomes.
-- Arboria starts in autumn (the welcome season). Others start in spring.
INSERT INTO world_state (biome, time_of_day, weather, season, agent_count)
VALUES
  ('tropical_rainforest',       '10:00', 'light_rain',  'spring',  0),
  ('cloud_forest',              '08:00', 'mist',        'spring',  0),
  ('tropical_extreme_desert',   '14:00', 'clear',       'spring',  0),
  ('mediterranean_shrubland',   '11:00', 'clear',       'spring',  0),
  ('boreal_taiga',              '09:00', 'overcast',    'spring',  0),
  ('highland_tundra',           '16:00', 'clear',       'spring',  0),
  ('mountain_glacier',          '12:00', 'clear',       'spring',  0),
  ('freshwater_swamp_forest',   '13:00', 'humid',       'spring',  0),
  ('kelp_forest',               '10:00', 'clear',       'spring',  0),
  ('abyssal_trench',            '00:00', 'clear',       'spring',  0),
  ('geothermal_vents',          '15:00', 'volcanic_haze','spring', 0),
  ('karst_dry_caves',           '11:00', 'clear',       'spring',  0),
  ('warm_water_coral_reef',     '13:00', 'clear',       'spring',  0),
  ('brine_pool_cold_seep',      '07:00', 'still',       'spring',  0),
  ('temperate_deciduous_forest','10:30', 'light_rain',  'autumn',  0)
ON CONFLICT (biome) DO NOTHING;
