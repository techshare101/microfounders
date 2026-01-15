"use server";

import { createClient } from "@supabase/supabase-js";

export async function submitInviteRequest(formData: FormData) {
  const email = formData.get("email") as string;
  const whatBuilding = formData.get("whatBuilding") as string;

  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid email required" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase env vars");
    return { success: false, error: "Configuration error." };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: "microfounders" }
  });

  const { error } = await supabase
    .from("invite_requests")
    .insert({
      email: email.toLowerCase().trim(),
      what_building: whatBuilding?.trim() || null,
    });

  if (error) {
    if (error.code === "23505") {
      return { success: true, message: "You're already on the list." };
    }
    console.error("Invite request error:", error);
    return { success: false, error: "Something went wrong. Try again." };
  }

  return { success: true, message: "You're on the list." };
}
