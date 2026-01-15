"use server";

import { createClient } from "@supabase/supabase-js";
import type { FounderPassport, PassportSkill, PassportNeed } from "../../lib/types/passport";

const SUPABASE_URL = "https://xshyzyewarjrpabwpdpc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaHl6eWV3YXJqcnBhYndwZHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwOTMzMzEsImV4cCI6MjA4MjY2OTMzMX0.crVI9qCslguwIp40sbbwxvelPUz3TTuPmcmy4crSvhI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =========================================================
// PASSPORT DATA
// =========================================================

export interface FullPassport {
  passport: FounderPassport;
  skills: PassportSkill[];
  needs: PassportNeed[];
}

export async function getPassportByEmail(email: string): Promise<FullPassport | null> {
  const { data: passport, error: passportError } = await supabase
    .from("mf_founder_passports")
    .select("*")
    .eq("email", email)
    .single();

  if (passportError || !passport) {
    console.error("Error fetching passport:", passportError);
    return null;
  }

  const { data: skills } = await supabase
    .from("mf_passport_skills")
    .select("*")
    .eq("passport_id", passport.id);

  const { data: needs } = await supabase
    .from("mf_passport_needs")
    .select("*")
    .eq("passport_id", passport.id);

  return {
    passport: passport as FounderPassport,
    skills: (skills || []) as PassportSkill[],
    needs: (needs || []) as PassportNeed[],
  };
}

export async function getPassportById(passportId: string): Promise<FullPassport | null> {
  const { data: passport, error: passportError } = await supabase
    .from("mf_founder_passports")
    .select("*")
    .eq("id", passportId)
    .single();

  if (passportError || !passport) {
    console.error("Error fetching passport:", passportError);
    return null;
  }

  const { data: skills } = await supabase
    .from("mf_passport_skills")
    .select("*")
    .eq("passport_id", passport.id);

  const { data: needs } = await supabase
    .from("mf_passport_needs")
    .select("*")
    .eq("passport_id", passport.id);

  return {
    passport: passport as FounderPassport,
    skills: (skills || []) as PassportSkill[],
    needs: (needs || []) as PassportNeed[],
  };
}

// =========================================================
// MATCHES DATA
// =========================================================

export interface MatchWithFounder {
  id: string;
  score: number;
  matchReasons: string[];
  status: string;
  createdAt: string;
  matchedFounder: {
    id: string;
    displayName: string | null;
    email: string;
    currentProject: string | null;
    archetype: string | null;
    projectStage: string | null;
  };
}

export async function getMatchesForPassport(passportId: string): Promise<MatchWithFounder[]> {
  const { data: matches, error } = await supabase
    .from("mf_matches")
    .select("*")
    .eq("founder_id", passportId)
    .eq("status", "suggested")
    .order("score", { ascending: false })
    .limit(10);

  if (error || !matches) {
    console.error("Error fetching matches:", error);
    return [];
  }

  // Fetch matched founder details
  const matchedFounderIds = matches.map((m) => m.matched_founder_id);
  
  if (matchedFounderIds.length === 0) {
    return [];
  }

  const { data: founders } = await supabase
    .from("mf_founder_passports")
    .select("id, display_name, email, current_project, archetype, project_stage")
    .in("id", matchedFounderIds);

  const founderMap = new Map(founders?.map((f) => [f.id, f]) || []);

  return matches.map((match) => {
    const founder = founderMap.get(match.matched_founder_id);
    return {
      id: match.id,
      score: match.score,
      matchReasons: match.match_reasons || [],
      status: match.status,
      createdAt: match.created_at,
      matchedFounder: {
        id: match.matched_founder_id,
        displayName: founder?.display_name || null,
        email: founder?.email || "Unknown",
        currentProject: founder?.current_project || null,
        archetype: founder?.archetype || null,
        projectStage: founder?.project_stage || null,
      },
    };
  });
}

export async function respondToMatch(
  matchId: string,
  response: "accepted" | "declined"
): Promise<boolean> {
  const { error } = await supabase
    .from("mf_matches")
    .update({
      status: response,
      responded_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (error) {
    console.error("Error responding to match:", error);
    return false;
  }

  return true;
}

// =========================================================
// CIRCLES DATA
// =========================================================

export interface CircleWithMembers {
  id: string;
  name: string;
  status: string;
  rotationDate: string | null;
  members: {
    id: string;
    displayName: string | null;
    email: string;
    role: string;
  }[];
  metadata: Record<string, unknown>;
}

export async function getCirclesForPassport(passportId: string): Promise<CircleWithMembers[]> {
  // Get circle memberships for this passport
  const { data: memberships, error: membershipError } = await supabase
    .from("mf_circle_memberships")
    .select("circle_id, role")
    .eq("passport_id", passportId)
    .eq("active", true);

  if (membershipError || !memberships || memberships.length === 0) {
    return [];
  }

  const circleIds = memberships.map((m) => m.circle_id);

  // Get circle details
  const { data: circles, error: circleError } = await supabase
    .from("mf_circles")
    .select("*")
    .in("id", circleIds)
    .in("status", ["active", "forming"]);

  if (circleError || !circles) {
    console.error("Error fetching circles:", circleError);
    return [];
  }

  // Get all members for these circles
  const { data: allMemberships } = await supabase
    .from("mf_circle_memberships")
    .select("circle_id, passport_id, role")
    .in("circle_id", circleIds)
    .eq("active", true);

  const memberPassportIds = [...new Set(allMemberships?.map((m) => m.passport_id) || [])];

  const { data: memberPassports } = await supabase
    .from("mf_founder_passports")
    .select("id, display_name, email")
    .in("id", memberPassportIds);

  const passportMap = new Map(memberPassports?.map((p) => [p.id, p]) || []);

  return circles.map((circle) => {
    const circleMembers = allMemberships?.filter((m) => m.circle_id === circle.id) || [];
    
    return {
      id: circle.id,
      name: circle.name,
      status: circle.status,
      rotationDate: circle.rotation_date,
      metadata: circle.metadata || {},
      members: circleMembers.map((m) => {
        const passport = passportMap.get(m.passport_id);
        return {
          id: m.passport_id,
          displayName: passport?.display_name || null,
          email: passport?.email || "Unknown",
          role: m.role,
        };
      }),
    };
  });
}

// =========================================================
// ACTIVITY DATA
// =========================================================

export interface ActivityItem {
  id: string;
  type: "match_accepted" | "match_declined" | "circle_invite" | "circle_joined" | "system";
  content: string;
  createdAt: string;
}

export async function getRecentActivity(passportId: string): Promise<ActivityItem[]> {
  // For now, return activity based on recent matches and circle changes
  const activities: ActivityItem[] = [];

  // Get recent match responses
  const { data: recentMatches } = await supabase
    .from("mf_matches")
    .select("id, status, responded_at, matched_founder_id")
    .or(`founder_id.eq.${passportId},matched_founder_id.eq.${passportId}`)
    .not("responded_at", "is", null)
    .order("responded_at", { ascending: false })
    .limit(5);

  if (recentMatches) {
    for (const match of recentMatches) {
      const isIncoming = match.matched_founder_id !== passportId;
      
      if (match.status === "accepted") {
        activities.push({
          id: `match-${match.id}`,
          type: "match_accepted",
          content: isIncoming ? "Someone accepted your match request" : "You connected with a new founder",
          createdAt: match.responded_at,
        });
      }
    }
  }

  // Get recent circle joins
  const { data: recentMemberships } = await supabase
    .from("mf_circle_memberships")
    .select("id, circle_id, joined_at")
    .eq("passport_id", passportId)
    .order("joined_at", { ascending: false })
    .limit(3);

  if (recentMemberships) {
    for (const membership of recentMemberships) {
      activities.push({
        id: `circle-${membership.id}`,
        type: "circle_joined",
        content: "You joined a new circle",
        createdAt: membership.joined_at,
      });
    }
  }

  // Sort by date
  return activities.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// =========================================================
// STATS
// =========================================================

export interface LoungeStats {
  totalMatches: number;
  pendingMatches: number;
  activeCircles: number;
  trustScore: number;
}

export async function getLoungeStats(passportId: string): Promise<LoungeStats> {
  const [matchesResult, circlesResult, passportResult] = await Promise.all([
    supabase
      .from("mf_matches")
      .select("id, status")
      .eq("founder_id", passportId),
    supabase
      .from("mf_circle_memberships")
      .select("id")
      .eq("passport_id", passportId)
      .eq("active", true),
    supabase
      .from("mf_founder_passports")
      .select("trust_score")
      .eq("id", passportId)
      .single(),
  ]);

  const matches = matchesResult.data || [];
  const circles = circlesResult.data || [];
  const passport = passportResult.data;

  return {
    totalMatches: matches.filter((m) => m.status === "accepted").length,
    pendingMatches: matches.filter((m) => m.status === "suggested").length,
    activeCircles: circles.length,
    trustScore: passport?.trust_score || 0,
  };
}
