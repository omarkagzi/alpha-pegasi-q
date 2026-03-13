import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client-side Supabase hook using the modern Third-Party Auth integration.
 * Clerk session tokens are passed directly via the `accessToken` option —
 * no JWT template needed. Supabase verifies them using Clerk's JWKS endpoint.
 */
export function useSupabase() {
  const { session } = useSession();

  return useMemo(() => {
    return createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => {
        return (await session?.getToken()) ?? null;
      },
    });
  }, [session]);
}
