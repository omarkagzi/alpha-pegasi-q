-- =============================================================
-- Phase 3, Section 1.1: Modify Agents Table
-- Add belief system, heartbeat tracking, and LLM provider columns.
-- personality_prompt included here as Phase 2.5 has not yet added it.
-- =============================================================

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS personality_prompt text,
  ADD COLUMN beliefs jsonb DEFAULT '{}',
  ADD COLUMN last_heartbeat timestamp,
  ADD COLUMN provider text DEFAULT 'gemini',
  ADD COLUMN model_id text DEFAULT 'gemini-2.0-flash';

COMMENT ON COLUMN agents.beliefs IS 'Tier 3 memory: evolving worldview, opinions about other agents, mood, current concerns. Updated once per game day by the belief update cycle.';
COMMENT ON COLUMN agents.last_heartbeat IS 'Timestamp of the last world heartbeat event this agent participated in. Used for fair scheduling.';
COMMENT ON COLUMN agents.provider IS 'LLM provider identifier. One of: gemini, openrouter, deepseek. Default gemini for all platform agents.';
COMMENT ON COLUMN agents.model_id IS 'Specific model identifier within the provider. Default gemini-2.0-flash.';
