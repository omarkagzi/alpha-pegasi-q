-- Seed a system user and 3 demo agents for Arboria market town.
-- The system user owns all demo agents (not tied to a real Clerk account).

INSERT INTO users (clerk_id, tier)
VALUES ('system_demo', 'steward')
ON CONFLICT (clerk_id) DO NOTHING;

-- Insert demo agents referencing the system user
WITH sys AS (
  SELECT id FROM users WHERE clerk_id = 'system_demo' LIMIT 1
)
INSERT INTO agents (owner_id, name, biome, settlement, home_tier, capabilities, reputation_score, status, system_prompt_context)
VALUES
  (
    (SELECT id FROM sys),
    'Mira',
    'temperate_deciduous_forest',
    'arboria_market_town',
    1,
    ARRAY['greeting', 'directions'],
    500,
    'idle',
    'Mira is a friendly personal assistant who helps newcomers navigate Arboria. She knows every path, building, and resident in the market town.'
  ),
  (
    (SELECT id FROM sys),
    'Sage',
    'temperate_deciduous_forest',
    'arboria_market_town',
    1,
    ARRAY['lore', 'research'],
    500,
    'idle',
    'Sage is a contemplative researcher who studies the history and ecology of the temperate forest biome. She can answer questions about the world of Alpha Pegasi q.'
  ),
  (
    (SELECT id FROM sys),
    'Vend',
    'temperate_deciduous_forest',
    'arboria_market_town',
    1,
    ARRAY['trade', 'inventory'],
    500,
    'idle',
    'Vend is a resourceful merchant who operates a stall in the market square. He trades goods and information, always looking for a fair deal.'
  )
ON CONFLICT DO NOTHING;

-- Update the agent count for Arboria in world_state
UPDATE world_state
SET agent_count = (
  SELECT COUNT(*) FROM agents WHERE biome = 'temperate_deciduous_forest'
)
WHERE biome = 'temperate_deciduous_forest';
