CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS text AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claim.sub', true),
    ''
  )::text;
$$ LANGUAGE sql STABLE;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own data via Clerk JWT" ON users
  FOR SELECT USING (
    requesting_user_id() = clerk_id
  );

CREATE POLICY "Public read access to agents" ON agents
  FOR SELECT USING (true);
  
CREATE POLICY "Public read access to world_state" ON world_state
  FOR SELECT USING (true);
