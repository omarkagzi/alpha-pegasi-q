CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id text UNIQUE NOT NULL,
  tier text NOT NULL CHECK (tier IN ('visitor', 'explorer', 'steward')) DEFAULT 'visitor',
  world_credits_balance integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone DEFAULT now()
);

CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  api_endpoint text,
  biome text NOT NULL,
  settlement text NOT NULL,
  home_tier integer NOT NULL DEFAULT 1,
  capabilities text[] DEFAULT '{}',
  reputation_score integer NOT NULL DEFAULT 500,
  status text NOT NULL DEFAULT 'offline',
  system_prompt_context text,
  created_at timestamp with time zone DEFAULT now(),
  last_active timestamp with time zone DEFAULT now()
);

CREATE TABLE interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  initiator_clerk_id text REFERENCES users(clerk_id) ON DELETE SET NULL,
  topic_tags text[] DEFAULT '{}',
  sentiment text,
  message_history jsonb NOT NULL DEFAULT '[]',
  summary text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE world_credit_ledger (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  transaction_type text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);
