// =========================================================
// MICROFOUNDER NETWORK — MATCHING ENGINE TYPES
// Phase 4.3: Core intelligence layer
// =========================================================

import type { 
  FounderPassport, 
  PassportSkill, 
  PassportNeed,
  Archetype,
  Availability,
  ProjectStage 
} from "../types/passport";

// =========================================================
// MATCHING DIMENSIONS
// =========================================================

/**
 * Match Score Breakdown
 * Each dimension contributes to the final match score
 */
export interface MatchScoreBreakdown {
  needsOffersAlignment: number;    // 0-30 points: Do their needs match your offers?
  stageComplementarity: number;    // 0-20 points: Are stages compatible?
  archetypeBalance: number;        // 0-15 points: Do archetypes complement?
  timezoneProximity: number;       // 0-15 points: Can they actually meet?
  availabilityMatch: number;       // 0-10 points: Are both available?
  intentAlignment: number;         // 0-10 points: Do intents align?
  trustBonus: number;              // 0-10 points: Trust score bonus
  total: number;                   // 0-110 points (normalized to 0-100)
}

/**
 * Match Result between two founders
 */
export interface MatchResult {
  founderId: string;
  matchedFounderId: string;
  score: number;                   // 0-100 normalized score
  breakdown: MatchScoreBreakdown;
  matchReasons: string[];          // Human-readable reasons
  disqualified: boolean;
  disqualifyReason?: string;
  createdAt: string;
}

/**
 * Founder Profile for matching (enriched passport)
 */
export interface MatchableFounder {
  passport: FounderPassport;
  skills: PassportSkill[];
  needs: PassportNeed[];
}

// =========================================================
// WEIGHTING RULES
// =========================================================

export const MATCH_WEIGHTS = {
  // Primary dimensions (highest impact)
  NEEDS_OFFERS: 30,          // Most important: mutual value exchange
  STAGE_COMPLEMENTARITY: 20, // Similar or adjacent stages work best
  
  // Secondary dimensions
  ARCHETYPE_BALANCE: 15,     // Complementary personalities
  TIMEZONE_PROXIMITY: 15,    // Practical meeting ability
  
  // Tertiary dimensions
  AVAILABILITY_MATCH: 10,    // Both need to be available
  INTENT_ALIGNMENT: 10,      // Similar goals for the network
  
  // Bonus
  TRUST_BONUS: 10,           // Established trust adds weight
} as const;

// =========================================================
// STAGE COMPATIBILITY MATRIX
// =========================================================

/**
 * Stage compatibility scores (0-1)
 * Higher = more compatible
 */
export const STAGE_COMPATIBILITY: Record<ProjectStage, Record<ProjectStage, number>> = {
  idea: {
    idea: 0.7,      // Can brainstorm together
    building: 0.9,  // Builder can guide ideator
    launched: 0.6,  // Some gap
    growing: 0.4,   // Different concerns
    scaling: 0.3,   // Very different
    paused: 0.5,    // Neutral
  },
  building: {
    idea: 0.9,      // Can help shape ideas
    building: 1.0,  // Perfect peers
    launched: 0.8,  // Close stages
    growing: 0.5,   // Some gap
    scaling: 0.4,   // Different focus
    paused: 0.6,    // Can re-energize
  },
  launched: {
    idea: 0.6,
    building: 0.8,
    launched: 1.0,  // Perfect peers
    growing: 0.9,   // Natural progression
    scaling: 0.6,
    paused: 0.5,
  },
  growing: {
    idea: 0.4,
    building: 0.5,
    launched: 0.9,
    growing: 1.0,   // Perfect peers
    scaling: 0.8,   // Close stages
    paused: 0.4,
  },
  scaling: {
    idea: 0.3,
    building: 0.4,
    launched: 0.6,
    growing: 0.8,
    scaling: 1.0,   // Perfect peers
    paused: 0.3,
  },
  paused: {
    idea: 0.5,
    building: 0.6,
    launched: 0.5,
    growing: 0.4,
    scaling: 0.3,
    paused: 0.7,    // Can support each other
  },
};

// =========================================================
// ARCHETYPE COMPATIBILITY MATRIX
// =========================================================

/**
 * Archetype compatibility scores (0-1)
 * Complementary archetypes score higher
 */
export const ARCHETYPE_COMPATIBILITY: Record<Archetype, Record<Archetype, number>> = {
  builder: {
    builder: 0.6,      // Can collaborate but similar
    strategist: 0.9,   // Great complement
    connector: 0.7,    // Connector finds opportunities
    specialist: 0.8,   // Deep expertise helps
    generalist: 0.7,   // Flexible support
    mentor: 0.8,       // Guidance valuable
    explorer: 0.6,     // Can guide explorer
  },
  strategist: {
    builder: 0.9,      // Needs execution
    strategist: 0.5,   // Too similar
    connector: 0.8,    // Network access
    specialist: 0.7,   // Deep knowledge
    generalist: 0.6,   // Broad view
    mentor: 0.7,       // Experience
    explorer: 0.7,     // Fresh perspective
  },
  connector: {
    builder: 0.7,
    strategist: 0.8,
    connector: 0.4,    // Overlap
    specialist: 0.6,
    generalist: 0.7,
    mentor: 0.8,
    explorer: 0.8,     // Can introduce
  },
  specialist: {
    builder: 0.8,
    strategist: 0.7,
    connector: 0.6,
    specialist: 0.5,   // Unless different domains
    generalist: 0.8,   // Good balance
    mentor: 0.7,
    explorer: 0.7,
  },
  generalist: {
    builder: 0.7,
    strategist: 0.6,
    connector: 0.7,
    specialist: 0.8,   // Depth + breadth
    generalist: 0.6,
    mentor: 0.7,
    explorer: 0.8,
  },
  mentor: {
    builder: 0.8,
    strategist: 0.7,
    connector: 0.8,
    specialist: 0.7,
    generalist: 0.7,
    mentor: 0.4,       // Both want to guide
    explorer: 0.9,     // Perfect match
  },
  explorer: {
    builder: 0.6,
    strategist: 0.7,
    connector: 0.8,
    specialist: 0.7,
    generalist: 0.8,
    mentor: 0.9,       // Needs guidance
    explorer: 0.7,     // Can explore together
  },
};

// =========================================================
// TIMEZONE PROXIMITY
// =========================================================

/**
 * Calculate timezone overlap score
 * @param tz1 Timezone string (e.g., "America/New_York")
 * @param tz2 Timezone string
 * @returns Score 0-1 based on overlap
 */
export function calculateTimezoneScore(tz1: string, tz2: string): number {
  // Simplified: use UTC offset difference
  const offsets: Record<string, number> = {
    "UTC": 0,
    "America/New_York": -5,
    "America/Chicago": -6,
    "America/Denver": -7,
    "America/Los_Angeles": -8,
    "Europe/London": 0,
    "Europe/Paris": 1,
    "Europe/Berlin": 1,
    "Asia/Tokyo": 9,
    "Asia/Singapore": 8,
    "Australia/Sydney": 11,
  };

  const offset1 = offsets[tz1] ?? 0;
  const offset2 = offsets[tz2] ?? 0;
  const diff = Math.abs(offset1 - offset2);

  // Score based on hour difference
  if (diff <= 2) return 1.0;      // Same or adjacent
  if (diff <= 4) return 0.8;      // Reasonable overlap
  if (diff <= 6) return 0.6;      // Some overlap
  if (diff <= 8) return 0.4;      // Limited overlap
  if (diff <= 10) return 0.2;     // Minimal overlap
  return 0.1;                      // Opposite sides
}

// =========================================================
// AVAILABILITY COMPATIBILITY
// =========================================================

export const AVAILABILITY_COMPATIBILITY: Record<Availability, Record<Availability, number>> = {
  open: {
    open: 1.0,
    limited: 0.8,
    focused: 0.5,
    unavailable: 0.1,
  },
  limited: {
    open: 0.8,
    limited: 0.9,
    focused: 0.6,
    unavailable: 0.2,
  },
  focused: {
    open: 0.5,
    limited: 0.6,
    focused: 0.7,
    unavailable: 0.3,
  },
  unavailable: {
    open: 0.1,
    limited: 0.2,
    focused: 0.3,
    unavailable: 0.0,
  },
};

// =========================================================
// DISQUALIFIERS
// =========================================================

export interface DisqualifyResult {
  disqualified: boolean;
  reason?: string;
}

/**
 * Hard disqualifiers that prevent a match
 */
export const DISQUALIFIERS = {
  // Both unavailable
  BOTH_UNAVAILABLE: (a: MatchableFounder, b: MatchableFounder): DisqualifyResult => {
    if (a.passport.availability === "unavailable" && b.passport.availability === "unavailable") {
      return { disqualified: true, reason: "Both founders are unavailable" };
    }
    return { disqualified: false };
  },

  // Same person
  SAME_PERSON: (a: MatchableFounder, b: MatchableFounder): DisqualifyResult => {
    if (a.passport.id === b.passport.id) {
      return { disqualified: true, reason: "Cannot match with self" };
    }
    return { disqualified: false };
  },

  // Inactive passport
  INACTIVE: (a: MatchableFounder, b: MatchableFounder): DisqualifyResult => {
    if (a.passport.status !== "active" || b.passport.status !== "active") {
      return { disqualified: true, reason: "One or both passports are not active" };
    }
    return { disqualified: false };
  },

  // No overlap in intent
  NO_INTENT_OVERLAP: (a: MatchableFounder, b: MatchableFounder): DisqualifyResult => {
    const aIntents = a.passport.intent_signals;
    const bIntents = b.passport.intent_signals;
    
    // Check for any shared intent
    const hasOverlap = Object.keys(aIntents).some(
      key => aIntents[key as keyof typeof aIntents] && bIntents[key as keyof typeof bIntents]
    );
    
    if (!hasOverlap && Object.keys(aIntents).length > 0 && Object.keys(bIntents).length > 0) {
      return { disqualified: true, reason: "No overlapping intents" };
    }
    return { disqualified: false };
  },
};

// =========================================================
// CIRCLE TYPES
// =========================================================

export type CircleStatus = "forming" | "active" | "paused" | "completed";

export interface Circle {
  id: string;
  name: string;
  description?: string;
  status: CircleStatus;
  maxMembers: number;
  currentMembers: string[];  // passport IDs
  createdAt: string;
  rotationDate?: string;     // When circle rotates
  metadata: Record<string, unknown>;
}

export interface CircleMembership {
  id: string;
  circleId: string;
  passportId: string;
  role: "member" | "facilitator";
  joinedAt: string;
  leftAt?: string;
  active: boolean;
}

// =========================================================
// CIRCLE FORMATION RULES
// =========================================================

export const CIRCLE_RULES = {
  MIN_MEMBERS: 4,
  MAX_MEMBERS: 6,
  IDEAL_MEMBERS: 5,
  
  // Rotation cadence (days)
  ROTATION_CADENCE: 90,
  
  // Balance requirements
  MIN_ARCHETYPE_DIVERSITY: 3,  // At least 3 different archetypes
  MAX_SAME_STAGE: 3,           // No more than 3 at same stage
  
  // Timezone rules
  MAX_TIMEZONE_SPREAD: 8,      // Max hours between furthest members
} as const;
