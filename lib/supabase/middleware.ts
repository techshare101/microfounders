// =========================================================
// MICROFOUNDER NETWORK — SUPABASE MIDDLEWARE CLIENT
// Middleware-compatible Supabase client
// =========================================================

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xshyzyewarjrpabwpdpc.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaHl6eWV3YXJqcnBhYndwZHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTMzMzEsImV4cCI6MjA4MjY2OTMzMX0.crVI9qCslguwIp40sbbwxvelPUz3TTuPmcmy4crSvhI";

export function createSupabaseMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  return { supabase, response };
}
