// =========================================================
// MICROFOUNDER NETWORK — SUPABASE SERVER CLIENT
// Server-side Supabase client with cookie handling
// =========================================================

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xshyzyewarjrpabwpdpc.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaHl6eWV3YXJqcnBhYndwZHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTMzMzEsImV4cCI6MjA4MjY2OTMzMX0.crVI9qCslguwIp40sbbwxvelPUz3TTuPmcmy4crSvhI";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Handle cookie errors in server components
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Handle cookie errors in server components
        }
      },
    },
  });
}
