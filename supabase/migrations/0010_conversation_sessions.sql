-- =============================================================
-- Phase 3, Section 1.4: Conversation Sessions Table
-- Persistent chat sessions between users and agents.
-- =============================================================

CREATE TABLE conversation_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id        uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  messages        jsonb NOT NULL DEFAULT '[]',
  file_references jsonb DEFAULT '[]',
  status          text DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  summary         text,
  sentiment       text,
  created_at      timestamp DEFAULT now(),
  updated_at      timestamp DEFAULT now()
);

-- Index for "load this user's active session with this agent"
CREATE INDEX idx_sessions_user_agent ON conversation_sessions (user_id, agent_id, status);

-- Index for "recent sessions for cleanup"
CREATE INDEX idx_sessions_updated ON conversation_sessions (updated_at DESC);

-- RLS: users can only access their own sessions
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own sessions" ON conversation_sessions
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Server can manage sessions" ON conversation_sessions
  FOR ALL USING (auth.role() = 'service_role');
