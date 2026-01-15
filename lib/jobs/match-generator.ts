// =========================================================
// MICROFOUNDER NETWORK — MATCH GENERATION JOB
// Automated match generation based on Ark Engine rules
// =========================================================

import { createClient } from "@supabase/supabase-js";
import { MatchingEngine } from "../matching/engine";
import type { MatchableFounder, MatchScoreBreakdown } from "../matching/types";
import type { 
  FounderPassport, 
  PassportSkill, 
  PassportNeed,
  ProjectStage,
  Archetype,
  Availability,
  MembershipTier,
  IntentSignals,
} from "../types/passport";
import { hasFounderOverride } from "../auth/founder-override";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xshyzyewarjrpabwpdpc.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Minimum score threshold for creating a match suggestion
const MIN_MATCH_SCORE = 40;

// Maximum pending matches per user
const MAX_PENDING_MATCHES = 5;

export interface MatchGenerationResult {
  success: boolean;
  matchesCreated: number;
  passportsProcessed: number;
  errors: string[];
  timestamp: string;
}

interface RawPassportData {
  id: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  current_project: string | null;
  project_url: string | null;
  project_stage: string | null;
  archetype: string | null;
  timezone: string | null;
  availability: string | null;
  weekly_hours_available: number | null;
  tier: string;
  trust_score: number | null;
  status: string;
  intent_signals: IntentSignals | null;
}

interface RawSkillData {
  skill_name: string;
  proficiency_level: string;
  willing_to_help: boolean;
}

interface RawNeedData {
  need_type: string;
  priority: string;
  description: string | null;
  fulfilled: boolean;
}

/**
 * Fetch all active passports with their skills and needs
 */
async function fetchActiveFounders(): Promise<MatchableFounder[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: passports, error } = await supabase
    .from("mf_founder_passports")
    .select("*")
    .eq("status", "active")
    .eq("onboarding_completed", true);

  if (error || !passports) {
    console.error("Error fetching passports:", error);
    return [];
  }

  const founders: MatchableFounder[] = [];

  for (const raw of passports as RawPassportData[]) {
    const { data: skills } = await supabase
      .from("mf_passport_skills")
      .select("skill_name, proficiency_level, willing_to_help")
      .eq("passport_id", raw.id);

    const { data: needs } = await supabase
      .from("mf_passport_needs")
      .select("need_type, priority, description, fulfilled")
      .eq("passport_id", raw.id);

    // Convert to MatchableFounder format
    const passport: FounderPassport = {
      id: raw.id,
      invite_request_id: null,
      email: raw.email,
      display_name: raw.display_name,
      avatar_url: raw.avatar_url,
      bio: raw.bio,
      current_project: raw.current_project,
      project_url: raw.project_url,
      project_stage: (raw.project_stage as ProjectStage) || "building",
      archetype: (raw.archetype as Archetype) || "builder",
      timezone: raw.timezone || "UTC",
      availability: (raw.availability as Availability) || "limited",
      weekly_hours_available: raw.weekly_hours_available || 5,
      tier: (raw.tier as MembershipTier) || "member",
      trust_score: raw.trust_score || 50,
      status: "active",
      intent_signals: raw.intent_signals || {},
      last_active_at: null,
      onboarded_at: null,
      created_at: "",
      updated_at: "",
    };

    const founderSkills: PassportSkill[] = (skills as RawSkillData[] || []).map(s => ({
      id: "",
      passport_id: raw.id,
      skill: s.skill_name,
      proficiency: s.proficiency_level as PassportSkill["proficiency"],
      willing_to_help: s.willing_to_help,
      created_at: "",
    }));

    const founderNeeds: PassportNeed[] = (needs as RawNeedData[] || []).map(n => ({
      id: "",
      passport_id: raw.id,
      need: n.need_type,
      priority: n.priority as PassportNeed["priority"],
      description: n.description,
      fulfilled: n.fulfilled || false,
      created_at: "",
    }));

    founders.push({
      passport,
      skills: founderSkills,
      needs: founderNeeds,
    });
  }

  return founders;
}

/**
 * Check if a match already exists between two passports
 */
async function matchExists(passportA: string, passportB: string): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data } = await supabase
    .from("mf_matches")
    .select("id")
    .or(`and(passport_a_id.eq.${passportA},passport_b_id.eq.${passportB}),and(passport_a_id.eq.${passportB},passport_b_id.eq.${passportA})`)
    .limit(1);

  return (data && data.length > 0) || false;
}

/**
 * Get count of pending matches for a passport
 */
async function getPendingMatchCount(passportId: string): Promise<number> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { count } = await supabase
    .from("mf_matches")
    .select("id", { count: "exact", head: true })
    .or(`passport_a_id.eq.${passportId},passport_b_id.eq.${passportId}`)
    .eq("status", "suggested");

  return count || 0;
}

/**
 * Create a match suggestion in the database
 */
async function createMatch(
  passportA: string,
  passportB: string,
  score: number,
  breakdown: MatchScoreBreakdown,
  reasons: string[]
): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { error } = await supabase.from("mf_matches").insert({
    passport_a_id: passportA,
    passport_b_id: passportB,
    match_score: score,
    score_breakdown: breakdown,
    match_reasons: reasons,
    status: "suggested",
    suggested_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error creating match:", error);
    return false;
  }

  return true;
}

/**
 * Main match generation job
 * Runs through all active passports and generates match suggestions
 */
export async function runMatchGeneration(): Promise<MatchGenerationResult> {
  const result: MatchGenerationResult = {
    success: true,
    matchesCreated: 0,
    passportsProcessed: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Fetch all active founders
    const founders = await fetchActiveFounders();
    result.passportsProcessed = founders.length;

    if (founders.length < 2) {
      result.errors.push("Not enough active passports for matching");
      return result;
    }

    // Generate matches for each founder
    for (let i = 0; i < founders.length; i++) {
      const founder = founders[i];

      // Founder override - no match limits
      const isFounder = hasFounderOverride(founder.passport.email);
      
      // Check if this passport already has max pending matches (founders bypass)
      const pendingCount = await getPendingMatchCount(founder.passport.id);
      if (!isFounder && pendingCount >= MAX_PENDING_MATCHES) {
        continue;
      }

      // Get other founders as candidates
      const candidates = founders.filter((_, idx) => idx !== i);

      // Use the matching engine to find best matches
      const matches = MatchingEngine.findBestMatches(founder, candidates, MAX_PENDING_MATCHES - pendingCount);

      for (const match of matches) {
        if (match.score < MIN_MATCH_SCORE) continue;

        // Check if match already exists
        const exists = await matchExists(founder.passport.id, match.matchedFounderId);
        if (exists) continue;

        const created = await createMatch(
          founder.passport.id,
          match.matchedFounderId,
          match.score,
          match.breakdown,
          match.matchReasons
        );

        if (created) {
          result.matchesCreated++;
        }
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

/**
 * Generate matches for a specific passport
 * Used when a new user completes onboarding
 */
export async function generateMatchesForPassport(passportId: string): Promise<MatchGenerationResult> {
  const result: MatchGenerationResult = {
    success: true,
    matchesCreated: 0,
    passportsProcessed: 1,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    const founders = await fetchActiveFounders();
    const targetFounder = founders.find(f => f.passport.id === passportId);

    if (!targetFounder) {
      result.errors.push("Passport not found or not active");
      result.success = false;
      return result;
    }

    const pendingCount = await getPendingMatchCount(passportId);

    if (pendingCount >= MAX_PENDING_MATCHES) {
      result.errors.push("Max pending matches reached");
      return result;
    }

    const remainingSlots = MAX_PENDING_MATCHES - pendingCount;
    const candidates = founders.filter(f => f.passport.id !== passportId);

    // Use the matching engine
    const matches = MatchingEngine.findBestMatches(targetFounder, candidates, remainingSlots);

    for (const match of matches) {
      if (match.score < MIN_MATCH_SCORE) continue;

      const exists = await matchExists(passportId, match.matchedFounderId);
      if (exists) continue;

      const created = await createMatch(
        passportId,
        match.matchedFounderId,
        match.score,
        match.breakdown,
        match.matchReasons
      );

      if (created) {
        result.matchesCreated++;
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}
