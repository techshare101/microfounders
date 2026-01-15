"use server";

import { createClient } from "@supabase/supabase-js";
import type { InviteRequest, InviteStatus, MembershipTier } from "../../lib/types/passport";

const SUPABASE_URL = "https://xshyzyewarjrpabwpdpc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaHl6eWV3YXJqcnBhYndwZHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTMzMzEsImV4cCI6MjA4MjY2OTMzMX0.crVI9qCslguwIp40sbbwxvelPUz3TTuPmcmy4crSvhI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getInviteRequests(status?: InviteStatus): Promise<InviteRequest[]> {
  let query = supabase
    .from("mf_invite_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching invite requests:", error);
    return [];
  }

  return data as InviteRequest[];
}

export async function updateInviteStatus(
  id: string,
  status: InviteStatus,
  options?: {
    review_notes?: string;
    tier_assigned?: MembershipTier | "waitlist";
    signal_score?: number;
  }
): Promise<boolean> {
  const updateData: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: "admin",
  };

  if (options?.review_notes !== undefined) {
    updateData.review_notes = options.review_notes;
  }
  if (options?.tier_assigned !== undefined) {
    updateData.tier_assigned = options.tier_assigned;
  }
  if (options?.signal_score !== undefined) {
    updateData.signal_score = options.signal_score;
  }

  const { error } = await supabase
    .from("mf_invite_requests")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating invite status:", error);
    return false;
  }

  return true;
}

export async function createPassportFromInvite(inviteId: string): Promise<string | null> {
  // Get the invite request
  const { data: invite, error: fetchError } = await supabase
    .from("mf_invite_requests")
    .select("*")
    .eq("id", inviteId)
    .single();

  if (fetchError || !invite) {
    console.error("Error fetching invite:", fetchError);
    return null;
  }

  // Create the passport with active status (approved = ready to use)
  const { data: passport, error: createError } = await supabase
    .from("mf_founder_passports")
    .insert({
      invite_request_id: inviteId,
      email: invite.email,
      current_project: invite.what_building,
      status: "active",
      tier: invite.tier_assigned || "member",
    })
    .select("id")
    .single();

  if (createError) {
    console.error("Error creating passport:", createError);
    return null;
  }

  // Link passport back to invite
  await supabase
    .from("mf_invite_requests")
    .update({ passport_id: passport.id })
    .eq("id", inviteId);

  return passport.id;
}

export async function getInviteStats(): Promise<{
  pending: number;
  approved: number;
  declined: number;
  waitlisted: number;
  total: number;
}> {
  const { data, error } = await supabase
    .from("mf_invite_requests")
    .select("status");

  if (error) {
    console.error("Error fetching stats:", error);
    return { pending: 0, approved: 0, declined: 0, waitlisted: 0, total: 0 };
  }

  const stats = {
    pending: 0,
    approved: 0,
    declined: 0,
    waitlisted: 0,
    total: data.length,
  };

  data.forEach((row) => {
    if (row.status === "pending" || row.status === "reviewing") {
      stats.pending++;
    } else if (row.status === "approved") {
      stats.approved++;
    } else if (row.status === "declined") {
      stats.declined++;
    } else if (row.status === "waitlisted") {
      stats.waitlisted++;
    }
  });

  return stats;
}
