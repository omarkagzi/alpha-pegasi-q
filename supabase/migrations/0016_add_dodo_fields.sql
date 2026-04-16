-- Add Dodo Payments columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS dodo_customer_id text,
  ADD COLUMN IF NOT EXISTS dodo_subscription_id text,
  ADD COLUMN IF NOT EXISTS founder_seat_number integer,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled'));
-- Note: Spec mentions 'payment_grace' status. Simplified to 'past_due' for launch.
-- Grace period logic (3-day window before downgrade) is a post-launch enhancement.

-- Index for Dodo customer lookups (used by webhooks)
CREATE INDEX IF NOT EXISTS idx_users_dodo_customer_id
  ON users(dodo_customer_id)
  WHERE dodo_customer_id IS NOT NULL;
