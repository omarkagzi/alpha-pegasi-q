-- Migrate tier values to match the Traveler/Steward narrative
-- visitor → traveler, explorer → traveler
-- steward remains steward

-- Drop the old constraint FIRST so the UPDATE to 'traveler' is allowed.
-- (The old constraint only permitted visitor/explorer/steward.)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tier_check;

UPDATE users SET tier = 'traveler' WHERE tier IN ('visitor', 'explorer');

-- Re-add the constraint with the new tier vocabulary.
ALTER TABLE users ADD CONSTRAINT users_tier_check CHECK (tier IN ('traveler', 'steward'));
