-- App configuration table for runtime-adjustable settings
-- Used for: founder seat counter, tier limits, feature flags
CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp DEFAULT now()
);

-- Seed initial config values
INSERT INTO app_config (key, value) VALUES
  ('founder_seats_claimed', '0'),
  ('founder_seats_max', '500'),
  ('traveler_daily_chat_limit', '10'),
  ('steward_daily_chat_limit', '50')
ON CONFLICT (key) DO NOTHING;

-- RLS: readable by all authenticated users, writable only by service role
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_read" ON app_config
  FOR SELECT TO authenticated
  USING (true);
