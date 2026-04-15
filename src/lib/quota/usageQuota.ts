import { createAdminClient } from '@/lib/supabase/server';

export interface QuotaCheckResult {
  allowed: boolean;
  turnsUsed: number;
  turnsLimit: number;
  narrativeMessage?: string;
}

/**
 * Default limits — used as fallback.
 * Spec requires these to be read from app_config table for runtime adjustment.
 * TODO post-launch: replace getQuotaLimit with app_config DB lookup + short TTL cache.
 * For launch, hardcoded defaults match the seeded app_config values exactly.
 */
const DEFAULT_LIMITS: Record<string, number> = {
  traveler: 10,
  steward: 50,
};

/** Narrative messages when quota is exhausted, keyed by agent name */
const QUOTA_NARRATIVES: Record<string, string> = {
  Mira: "The settlement grows quiet for the night. I should rest too, traveler. Return tomorrow, or become a Steward to stay longer.",
  Forge: "My workshop needs tending, and the hour grows late. Come back tomorrow — unless you'd like to become a Steward and keep the fires burning.",
  Archon: "The library is closing for the evening. Knowledge will wait for you tomorrow — or you could become a Steward and gain access to the deeper archives.",
  Ledger: "The market stalls are shutting down. Good business takes rest. Return tomorrow, or become a Steward to extend your time here.",
  Ember: "The tavern's winding down for tonight. The stories will be here tomorrow — or become a Steward and the night is yours.",
  default: "The settlement grows quiet for the night. Return tomorrow, or become a Steward to stay longer.",
};

/**
 * Returns the daily chat turn limit for a tier.
 * Accepts either DB tier names ('explorer', 'visitor') or product tier names ('traveler').
 * Any non-steward tier maps to the traveler limit.
 */
export function getQuotaLimit(tier: string): number {
  if (tier === 'steward') return DEFAULT_LIMITS.steward;
  return DEFAULT_LIMITS.traveler; // explorer, visitor, traveler, or unknown → traveler
}

/**
 * Checks if a user can send a chat message and increments their counter.
 * Returns the result BEFORE making the LLM call — never call LLM if quota exhausted.
 *
 * Approach: atomically increment FIRST, then check the returned count.
 * This avoids the TOCTOU race condition of check-then-increment.
 * If over limit, the count is inflated by 1 phantom turn — acceptable tradeoff.
 */
export async function checkAndIncrementQuota(
  userId: string,
  tier: string,
  agentName: string
): Promise<QuotaCheckResult> {
  const supabaseAdmin = createAdminClient();
  const limit = getQuotaLimit(tier);

  // Atomically increment and get new count — single DB round-trip
  const { data: newCount, error } = await supabaseAdmin.rpc('increment_chat_turns', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Quota increment error:', error);
    // On error, allow the request (fail open) — don't block users due to quota bugs
    return { allowed: true, turnsUsed: 0, turnsLimit: limit };
  }

  // Check if over limit AFTER increment
  if (newCount > limit) {
    return {
      allowed: false,
      turnsUsed: newCount,
      turnsLimit: limit,
      narrativeMessage: QUOTA_NARRATIVES[agentName] ?? QUOTA_NARRATIVES.default,
    };
  }

  return { allowed: true, turnsUsed: newCount, turnsLimit: limit };
}
