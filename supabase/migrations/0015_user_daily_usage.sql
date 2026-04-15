-- Tracks daily usage per user for quota enforcement
CREATE TABLE IF NOT EXISTS user_daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  chat_turns_used integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Index for fast lookups during chat quota checks
CREATE INDEX idx_user_daily_usage_lookup ON user_daily_usage(user_id, usage_date);

-- RLS: users can only read their own usage
ALTER TABLE user_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_usage" ON user_daily_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Function to atomically increment chat turns and return the new count
CREATE OR REPLACE FUNCTION increment_chat_turns(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  new_count integer;
  today date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  INSERT INTO user_daily_usage (user_id, usage_date, chat_turns_used)
  VALUES (p_user_id, today, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    chat_turns_used = user_daily_usage.chat_turns_used + 1,
    updated_at = now()
  RETURNING chat_turns_used INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
