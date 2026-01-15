"use server";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xshyzyewarjrpabwpdpc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaHl6eWV3YXJqcnBhYndwZHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTMzMzEsImV4cCI6MjA4MjY2OTMzMX0.crVI9qCslguwIp40sbbwxvelPUz3TTuPmcmy4crSvhI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function submitInviteRequest(formData: FormData) {
  const email = formData.get("email") as string;
  const whatBuilding = formData.get("whatBuilding") as string;

  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid email required" };
  }

  try {
    const { data, error } = await supabase
      .from("mf_invite_requests")
      .insert({
        email: email.toLowerCase().trim(),
        what_building: whatBuilding?.trim() || null,
      });

    console.log("Supabase result:", { data, error });

    if (error) {
      console.error("Supabase error:", error);
      if (error.code === "23505") {
        return { success: true, message: "You're already on the list." };
      }
      return { success: false, error: "Something went wrong. Try again." };
    }

    return { success: true, message: "You're on the list." };
  } catch (e) {
    console.error("Unexpected error:", e);
    return { success: false, error: "Something went wrong. Try again." };
  }
}
