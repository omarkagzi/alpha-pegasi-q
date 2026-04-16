import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface FounderStatus {
  seatsClaimed: number;
  seatsMax: number;
  seatsRemaining: number;
  isFounderAvailable: boolean;
}

/**
 * Gets the current founder seat count.
 * Safe to call from public endpoints (landing page, upgrade page).
 */
export async function getFounderStatus(): Promise<FounderStatus> {
  const { data } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'founder_seats_claimed')
    .single();

  const { data: maxData } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'founder_seats_max')
    .single();

  const claimed = parseInt(data?.value ?? '0', 10);
  const max = parseInt(maxData?.value ?? '500', 10);

  return {
    seatsClaimed: claimed,
    seatsMax: max,
    seatsRemaining: Math.max(0, max - claimed),
    isFounderAvailable: claimed < max,
  };
}

/**
 * Atomically increments the founder seat counter.
 * Returns the new seat number, or null if all seats are taken.
 * Allows up to 510 seats (10-seat buffer for race conditions).
 * Uses compare-and-swap with bounded retries.
 */
export async function claimFounderSeat(retries = 3): Promise<number | null> {
  const BUFFER = 10;

  const { data: maxData } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'founder_seats_max')
    .single();

  const max = parseInt(maxData?.value ?? '500', 10);

  // Read-then-increment with optimistic concurrency
  const { data: current } = await supabaseAdmin
    .from('app_config')
    .select('value')
    .eq('key', 'founder_seats_claimed')
    .single();

  const currentCount = parseInt(current?.value ?? '0', 10);

  if (currentCount >= max + BUFFER) {
    return null; // All seats taken (including buffer)
  }

  const newCount = currentCount + 1;

  // Compare-and-swap: only update if value hasn't changed since we read it
  const { error, count } = await supabaseAdmin
    .from('app_config')
    .update({ value: String(newCount), updated_at: new Date().toISOString() })
    .eq('key', 'founder_seats_claimed')
    .eq('value', String(currentCount)); // Optimistic lock

  // Check BOTH error AND affected row count.
  // A concurrent write causes count=0 (CAS miss), not an error.
  if (error || count === 0) {
    if (retries <= 0) {
      console.error('claimFounderSeat: max retries exceeded');
      return null;
    }
    return claimFounderSeat(retries - 1);
  }

  return newCount;
}
