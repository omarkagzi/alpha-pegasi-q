import { createClient } from "@supabase/supabase-js";

/**
 * Standalone Supabase client for use outside of React components.
 * Uses the anon key — suitable for reading public data (world_state, agents)
 * from Phaser engine code where React hooks are unavailable.
 */
export const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
