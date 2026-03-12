import { createClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function useSupabase() {
  const { session } = useSession();

  return useMemo(() => {
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await session?.getToken({ template: "supabase" });

          const headers = new Headers(options?.headers);
          if (clerkToken) {
            headers.set("Authorization", `Bearer ${clerkToken}`);
          }

          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    });
  }, [session]);
}
