-- =============================================================
-- Phase 3, Section 1.2: Relationships Table
-- Tracks pairwise relationship state between all entities
-- (agent-to-agent and user-to-agent).
-- =============================================================

CREATE TABLE relationships (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_a_id         uuid NOT NULL,
  entity_a_type       text NOT NULL CHECK (entity_a_type IN ('agent', 'user')),
  entity_b_id         uuid NOT NULL,
  entity_b_type       text NOT NULL CHECK (entity_b_type IN ('agent', 'user')),
  interaction_count   integer DEFAULT 0,
  aggregate_sentiment text DEFAULT 'neutral' CHECK (aggregate_sentiment IN ('warm', 'neutral', 'cool', 'tense')),
  shared_topics       text[] DEFAULT '{}',
  notable_moments     text[] DEFAULT '{}',
  arc_stage           text DEFAULT 'new' CHECK (arc_stage IN ('new', 'acquaintance', 'familiar', 'close', 'strained')),
  last_interaction    timestamp,
  created_at          timestamp DEFAULT now(),

  CONSTRAINT unique_relationship UNIQUE (entity_a_id, entity_b_id)
);

-- Index for fast lookups: "all relationships involving this entity"
CREATE INDEX idx_relationships_entity_a ON relationships (entity_a_id);
CREATE INDEX idx_relationships_entity_b ON relationships (entity_b_id);

-- RLS: authenticated users can read all relationships, write only their own
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read relationships" ON relationships
  FOR SELECT USING (true);

CREATE POLICY "Server can manage relationships" ON relationships
  FOR ALL USING (auth.role() = 'service_role');
