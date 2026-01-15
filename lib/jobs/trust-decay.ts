// =========================================================
// MICROFOUNDER NETWORK — TRUST DECAY JOB
// Automated trust score management based on activity
// =========================================================

import { createClient } from "@supabase/supabase-js";
import { hasFounderOverride } from "../auth/founder-override";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xshyzyewarjrpabwpdpc.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Trust decay configuration
const TRUST_CONFIG = {
  // Decay rates
  DECAY_PER_INACTIVE_DAY: 0.5,     // Points lost per day of inactivity
  MAX_DECAY_PER_RUN: 5,            // Maximum points to decay in one job run
  
  // Thresholds
  MIN_TRUST_SCORE: 0,              // Floor
  MAX_TRUST_SCORE: 100,            // Ceiling
  DEFAULT_TRUST_SCORE: 50,         // Starting score
  
  // Activity windows
  GRACE_PERIOD_DAYS: 7,            // No decay for first N days of inactivity
  ACTIVITY_BOOST_WINDOW_DAYS: 30,  // Recent activity within N days gets boost
  
  // Boost amounts
  MATCH_ACCEPTED_BOOST: 3,
  CIRCLE_JOINED_BOOST: 5,
  MEETING_ATTENDED_BOOST: 2,
  FEEDBACK_GIVEN_BOOST: 1,
};

export interface TrustDecayResult {
  success: boolean;
  passportsProcessed: number;
  trustDecayed: number;
  trustBoosted: number;
  errors: string[];
  timestamp: string;
}

interface PassportTrustData {
  id: string;
  email: string;
  trust_score: number;
  last_active_at: string | null;
  status: string;
}

/**
 * Calculate days since last activity
 */
function daysSinceActivity(lastActiveAt: string | null): number {
  if (!lastActiveAt) return 999; // Never active
  
  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  return Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate trust decay amount
 */
function calculateDecay(daysInactive: number): number {
  if (daysInactive <= TRUST_CONFIG.GRACE_PERIOD_DAYS) {
    return 0;
  }
  
  const decayableDays = daysInactive - TRUST_CONFIG.GRACE_PERIOD_DAYS;
  const decay = decayableDays * TRUST_CONFIG.DECAY_PER_INACTIVE_DAY;
  
  return Math.min(decay, TRUST_CONFIG.MAX_DECAY_PER_RUN);
}

/**
 * Apply trust decay to a passport
 */
async function applyDecay(passportId: string, currentScore: number, decayAmount: number): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const newScore = Math.max(
    TRUST_CONFIG.MIN_TRUST_SCORE,
    currentScore - decayAmount
  );
  
  const { error } = await supabase
    .from("mf_founder_passports")
    .update({
      trust_score: newScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", passportId);
  
  if (error) {
    console.error("Error applying trust decay:", error);
    return false;
  }
  
  return true;
}

/**
 * Check for recent positive activity and apply boosts
 */
async function checkAndApplyBoosts(passportId: string, currentScore: number): Promise<number> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - TRUST_CONFIG.ACTIVITY_BOOST_WINDOW_DAYS);
  
  // Check for recent match acceptances
  const { count: matchesAccepted } = await supabase
    .from("mf_matches")
    .select("id", { count: "exact", head: true })
    .or(`passport_a_id.eq.${passportId},passport_b_id.eq.${passportId}`)
    .eq("status", "accepted")
    .gte("responded_at", windowStart.toISOString());
  
  // Check for recent circle joins
  const { count: circlesJoined } = await supabase
    .from("mf_circle_members")
    .select("id", { count: "exact", head: true })
    .eq("passport_id", passportId)
    .eq("status", "active")
    .gte("joined_at", windowStart.toISOString());
  
  // Calculate total boost
  let boost = 0;
  boost += (matchesAccepted || 0) * TRUST_CONFIG.MATCH_ACCEPTED_BOOST;
  boost += (circlesJoined || 0) * TRUST_CONFIG.CIRCLE_JOINED_BOOST;
  
  if (boost > 0) {
    const newScore = Math.min(
      TRUST_CONFIG.MAX_TRUST_SCORE,
      currentScore + boost
    );
    
    await supabase
      .from("mf_founder_passports")
      .update({
        trust_score: newScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", passportId);
    
    return boost;
  }
  
  return 0;
}

/**
 * Main trust decay job
 */
export async function runTrustDecay(): Promise<TrustDecayResult> {
  const result: TrustDecayResult = {
    success: true,
    passportsProcessed: 0,
    trustDecayed: 0,
    trustBoosted: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Fetch all active passports
    const { data: passports, error } = await supabase
      .from("mf_founder_passports")
      .select("id, email, trust_score, last_active_at, status")
      .eq("status", "active");
    
    if (error) {
      result.success = false;
      result.errors.push("Failed to fetch passports");
      return result;
    }
    
    for (const passport of (passports as PassportTrustData[]) || []) {
      result.passportsProcessed++;
      
      // Founder override - skip trust decay entirely
      if (hasFounderOverride(passport.email)) {
        continue;
      }
      
      const daysInactive = daysSinceActivity(passport.last_active_at);
      
      // Check for boosts first
      const boost = await checkAndApplyBoosts(passport.id, passport.trust_score);
      if (boost > 0) {
        result.trustBoosted++;
        continue; // Skip decay if boosted
      }
      
      // Apply decay if inactive
      const decayAmount = calculateDecay(daysInactive);
      if (decayAmount > 0) {
        const applied = await applyDecay(passport.id, passport.trust_score, decayAmount);
        if (applied) {
          result.trustDecayed++;
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
 * Boost trust for a specific action
 */
export async function boostTrustForAction(
  passportId: string,
  action: "match_accepted" | "circle_joined" | "meeting_attended" | "feedback_given"
): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Get current score
  const { data: passport } = await supabase
    .from("mf_founder_passports")
    .select("trust_score")
    .eq("id", passportId)
    .single();
  
  if (!passport) return false;
  
  const boostMap = {
    match_accepted: TRUST_CONFIG.MATCH_ACCEPTED_BOOST,
    circle_joined: TRUST_CONFIG.CIRCLE_JOINED_BOOST,
    meeting_attended: TRUST_CONFIG.MEETING_ATTENDED_BOOST,
    feedback_given: TRUST_CONFIG.FEEDBACK_GIVEN_BOOST,
  };
  
  const boost = boostMap[action];
  const newScore = Math.min(
    TRUST_CONFIG.MAX_TRUST_SCORE,
    passport.trust_score + boost
  );
  
  const { error } = await supabase
    .from("mf_founder_passports")
    .update({
      trust_score: newScore,
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", passportId);
  
  return !error;
}

/**
 * Get trust score distribution
 */
export async function getTrustDistribution(): Promise<{
  excellent: number;  // 80-100
  good: number;       // 60-79
  average: number;    // 40-59
  low: number;        // 20-39
  critical: number;   // 0-19
}> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { data: passports } = await supabase
    .from("mf_founder_passports")
    .select("trust_score")
    .eq("status", "active");
  
  const distribution = {
    excellent: 0,
    good: 0,
    average: 0,
    low: 0,
    critical: 0,
  };
  
  for (const p of passports || []) {
    const score = p.trust_score || 50;
    if (score >= 80) distribution.excellent++;
    else if (score >= 60) distribution.good++;
    else if (score >= 40) distribution.average++;
    else if (score >= 20) distribution.low++;
    else distribution.critical++;
  }
  
  return distribution;
}
