"use server";

const SUPABASE_URL = "https://xshyzyewarjrpabwpdpc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaHl6eWV3YXJqcnBhYndwZHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTMzMzEsImV4cCI6MjA4MjY2OTMzMX0.crVI9qCslguwIp40sbbwxvelPUz3TTuPmcmy4crSvhI";

export async function submitInviteRequest(formData: FormData) {
  const email = formData.get("email") as string;
  const whatBuilding = formData.get("whatBuilding") as string;

  if (!email || !email.includes("@")) {
    return { success: false, error: "Valid email required" };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/invite_requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal",
        "Accept-Profile": "microfounders",
        "Content-Profile": "microfounders",
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        what_building: whatBuilding?.trim() || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supabase REST error:", response.status, errorText);
      if (response.status === 409 || errorText.includes("23505")) {
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
