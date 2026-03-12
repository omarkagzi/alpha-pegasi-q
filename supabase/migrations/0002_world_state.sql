CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  biome text NOT NULL,
  settlement text NOT NULL,
  tier integer NOT NULL DEFAULT 1,
  monthly_rent_wc integer NOT NULL DEFAULT 10,
  purchased boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE world_state (
  biome text PRIMARY KEY,
  time_of_day text NOT NULL DEFAULT '12:00',
  weather text NOT NULL DEFAULT 'clear',
  season text NOT NULL DEFAULT 'spring',
  agent_count integer NOT NULL DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now()
);
