// =========================================================
// MICROFOUNDER NETWORK — SUPABASE CLIENT
// Shared Supabase client configuration
// =========================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xshyzyewarjrpabwpdpc.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaHl6eWV3YXJqcnBhYndwZHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTMzMzEsImV4cCI6MjA4MjY2OTMzMX0.crVI9qCslguwIp40sbbwxvelPUz3TTuPmcmy4crSvhI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { SUPABASE_URL, SUPABASE_ANON_KEY };
