-- =============================================================
-- Comprehensive RLS policies for Clerk Third-Party Auth
-- auth.jwt()->>'sub' returns the Clerk user ID
-- Supabase verifies Clerk JWTs via JWKS (no shared secret needed)
-- =============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_state ENABLE ROW LEVEL SECURITY;

-- ========================
-- USERS TABLE
-- ========================

CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'sub') = clerk_id);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'sub') = clerk_id)
  WITH CHECK ((select auth.jwt()->>'sub') = clerk_id);

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'sub') = clerk_id);

-- ========================
-- AGENTS TABLE
-- ========================

CREATE POLICY "agents_select_public"
  ON agents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "agents_select_anon"
  ON agents FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "agents_insert_own"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id IN (
      SELECT id FROM users WHERE clerk_id = (select auth.jwt()->>'sub')
    )
  );

CREATE POLICY "agents_update_own"
  ON agents FOR UPDATE
  TO authenticated
  USING (
    owner_id IN (
      SELECT id FROM users WHERE clerk_id = (select auth.jwt()->>'sub')
    )
  )
  WITH CHECK (
    owner_id IN (
      SELECT id FROM users WHERE clerk_id = (select auth.jwt()->>'sub')
    )
  );

CREATE POLICY "agents_delete_own"
  ON agents FOR DELETE
  TO authenticated
  USING (
    owner_id IN (
      SELECT id FROM users WHERE clerk_id = (select auth.jwt()->>'sub')
    )
  );

-- ========================
-- INTERACTIONS TABLE
-- ========================

CREATE POLICY "interactions_select_own"
  ON interactions FOR SELECT
  TO authenticated
  USING (initiator_clerk_id = (select auth.jwt()->>'sub'));

CREATE POLICY "interactions_insert_own"
  ON interactions FOR INSERT
  TO authenticated
  WITH CHECK (initiator_clerk_id = (select auth.jwt()->>'sub'));

-- ========================
-- WORLD_CREDIT_LEDGER TABLE
-- ========================

CREATE POLICY "ledger_select_own"
  ON world_credit_ledger FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = (select auth.jwt()->>'sub')
    )
  );

-- Ledger inserts are server-side only (via service_role)

-- ========================
-- PROPERTIES TABLE
-- ========================

CREATE POLICY "properties_select_public"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "properties_select_anon"
  ON properties FOR SELECT
  TO anon
  USING (true);

-- ========================
-- WORLD_STATE TABLE
-- ========================

CREATE POLICY "world_state_select_public"
  ON world_state FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "world_state_select_anon"
  ON world_state FOR SELECT
  TO anon
  USING (true);

-- World state updates are server-side only (via service_role / cron)
