// =========================================================
// MICROFOUNDER NETWORK — CIRCLE FORMATION RULES
// Phase 4.4: Complete circle governance and formation logic
// =========================================================

import type { MatchableFounder, Circle, CircleMembership } from "./types";
import type { Archetype, ProjectStage, Availability } from "../types/passport";

// =========================================================
// CIRCLE CONFIGURATION (ARK GOVERNED)
// =========================================================

export const CIRCLE_CONFIG = {
  // Size constraints
  SIZE: {
    MIN: 4,
    MAX: 6,
    IDEAL: 5,
  },

  // Rotation cadence (days)
  ROTATION: {
    STANDARD_CADENCE: 90,      // 3 months
    MINIMUM_CADENCE: 60,       // 2 months minimum
    MAXIMUM_CADENCE: 120,      // 4 months maximum
    GRACE_PERIOD: 14,          // Days before forced rotation
  },

  // Balance requirements
  BALANCE: {
    MIN_ARCHETYPE_DIVERSITY: 3,    // At least 3 different archetypes
    MAX_SAME_STAGE: 3,             // No more than 3 at same stage
    MAX_SAME_ARCHETYPE: 2,         // No more than 2 of same archetype
    MAX_TIMEZONE_SPREAD_HOURS: 8,  // Max hours between furthest members
    MIN_AVAILABILITY_OVERLAP: 2,   // Minimum shared hours per week
  },

  // Trust thresholds
  TRUST: {
    MIN_INDIVIDUAL_SCORE: 20,      // Minimum trust to join any circle
    MIN_CIRCLE_AVERAGE: 40,        // Minimum average trust for circle
    FACILITATOR_MIN_SCORE: 60,     // Minimum trust to be facilitator
  },

  // Engagement thresholds
  ENGAGEMENT: {
    MIN_ACTIVITY_DAYS: 7,          // Must be active within N days
    WARNING_INACTIVE_DAYS: 14,     // Warning after N days inactive
    REMOVAL_INACTIVE_DAYS: 30,     // Remove after N days inactive
  },
} as const;

// =========================================================
// ROLE BALANCE RULES
// =========================================================

export type OperatorType = "builder" | "strategist" | "hybrid";

/**
 * Map archetypes to operator types for balance calculations
 */
export function getOperatorType(archetype: Archetype | null): OperatorType {
  switch (archetype) {
    case "builder":
    case "specialist":
      return "builder";
    case "strategist":
    case "mentor":
      return "strategist";
    case "connector":
    case "generalist":
    case "explorer":
    default:
      return "hybrid";
  }
}

/**
 * Ideal role distribution for a circle
 */
export const IDEAL_ROLE_DISTRIBUTION = {
  builder: { min: 1, max: 3, ideal: 2 },
  strategist: { min: 1, max: 2, ideal: 1 },
  hybrid: { min: 1, max: 3, ideal: 2 },
} as const;

// =========================================================
// STAGE DISTRIBUTION RULES
// =========================================================

/**
 * Stage groupings for balance calculations
 */
export type StageGroup = "early" | "growth" | "mature";

export function getStageGroup(stage: ProjectStage | null): StageGroup {
  switch (stage) {
    case "idea":
    case "building":
      return "early";
    case "launched":
    case "growing":
      return "growth";
    case "scaling":
    case "paused":
    default:
      return "mature";
  }
}

/**
 * Ideal stage distribution
 */
export const IDEAL_STAGE_DISTRIBUTION = {
  early: { min: 1, max: 3, ideal: 2 },
  growth: { min: 1, max: 3, ideal: 2 },
  mature: { min: 0, max: 2, ideal: 1 },
} as const;

// =========================================================
// CIRCLE LIFECYCLE STATES
// =========================================================

export type CircleLifecycleState =
  | "forming"      // Gathering members
  | "active"       // Running normally
  | "warning"      // Low engagement, needs attention
  | "paused"       // Temporarily suspended
  | "rotating"     // In rotation period
  | "dissolving"   // Being dissolved
  | "completed";   // Successfully completed cycle

export interface CircleHealthMetrics {
  memberCount: number;
  activeMembers: number;
  averageTrustScore: number;
  archetypeDiversity: number;
  stageDiversity: number;
  timezoneSpread: number;
  lastActivityDate: string | null;
  engagementScore: number;
  healthStatus: "healthy" | "warning" | "critical";
}

// =========================================================
// ENTRY RULES
// =========================================================

export interface CircleEntryResult {
  allowed: boolean;
  reason?: string;
  warnings?: string[];
}

/**
 * Check if a founder can join a specific circle
 */
export function canJoinCircle(
  founder: MatchableFounder,
  circle: Circle,
  currentMembers: MatchableFounder[]
): CircleEntryResult {
  const warnings: string[] = [];

  // Check circle capacity
  if (currentMembers.length >= CIRCLE_CONFIG.SIZE.MAX) {
    return { allowed: false, reason: "Circle is at maximum capacity" };
  }

  // Check founder trust score
  if (founder.passport.trust_score < CIRCLE_CONFIG.TRUST.MIN_INDIVIDUAL_SCORE) {
    return { allowed: false, reason: "Trust score below minimum threshold" };
  }

  // Check founder availability
  if (founder.passport.availability === "unavailable") {
    return { allowed: false, reason: "Founder is currently unavailable" };
  }

  // Check founder status
  if (founder.passport.status !== "active") {
    return { allowed: false, reason: "Passport is not active" };
  }

  // Check archetype balance
  const archetypeCounts = countArchetypes(currentMembers);
  const founderArchetype = founder.passport.archetype;
  if (founderArchetype && archetypeCounts[founderArchetype] >= CIRCLE_CONFIG.BALANCE.MAX_SAME_ARCHETYPE) {
    warnings.push("Adding this member reduces archetype diversity");
  }

  // Check stage balance
  const stageCounts = countStages(currentMembers);
  const founderStage = founder.passport.project_stage;
  if (founderStage && stageCounts[founderStage] >= CIRCLE_CONFIG.BALANCE.MAX_SAME_STAGE) {
    return { allowed: false, reason: "Too many members at the same stage" };
  }

  // Check timezone compatibility
  const timezones = currentMembers.map(m => m.passport.timezone);
  timezones.push(founder.passport.timezone);
  if (!isTimezoneSpreadAcceptable(timezones)) {
    return { allowed: false, reason: "Timezone spread would exceed maximum" };
  }

  return { allowed: true, warnings: warnings.length > 0 ? warnings : undefined };
}

// =========================================================
// EXIT RULES
// =========================================================

export type ExitReason =
  | "voluntary"        // Member chose to leave
  | "inactivity"       // Removed due to inactivity
  | "trust_decay"      // Trust score dropped below threshold
  | "rotation"         // Normal rotation cycle
  | "dissolution"      // Circle dissolved
  | "admin_action";    // Admin removed member

export interface CircleExitResult {
  shouldExit: boolean;
  reason?: ExitReason;
  gracePeriodDays?: number;
}

/**
 * Check if a member should exit a circle
 */
export function shouldExitCircle(
  member: MatchableFounder,
  membership: CircleMembership,
  circle: Circle
): CircleExitResult {
  // Check inactivity
  const lastActive = member.passport.last_active_at;
  if (lastActive) {
    const daysSinceActive = daysSince(lastActive);
    if (daysSinceActive >= CIRCLE_CONFIG.ENGAGEMENT.REMOVAL_INACTIVE_DAYS) {
      return { shouldExit: true, reason: "inactivity" };
    }
  }

  // Check trust decay
  if (member.passport.trust_score < CIRCLE_CONFIG.TRUST.MIN_INDIVIDUAL_SCORE) {
    return { shouldExit: true, reason: "trust_decay", gracePeriodDays: 7 };
  }

  // Check availability change
  if (member.passport.availability === "unavailable") {
    return { shouldExit: true, reason: "voluntary", gracePeriodDays: 14 };
  }

  // Check rotation date
  if (circle.rotationDate && new Date(circle.rotationDate) <= new Date()) {
    return { shouldExit: true, reason: "rotation" };
  }

  return { shouldExit: false };
}

// =========================================================
// ROTATION LOGIC
// =========================================================

export interface RotationPlan {
  circleId: string;
  membersToRotateOut: string[];
  suggestedReplacements: string[];
  rotationType: "partial" | "full" | "renewal";
  reason: string;
}

/**
 * Determine rotation strategy for a circle
 */
export function planRotation(
  circle: Circle,
  members: MatchableFounder[],
  memberships: CircleMembership[],
  availablePool: MatchableFounder[]
): RotationPlan {
  const rotateOut: string[] = [];
  const reasons: string[] = [];

  // Check each member for rotation eligibility
  for (const member of members) {
    const membership = memberships.find(m => m.passportId === member.passport.id);
    if (!membership) continue;

    const exitCheck = shouldExitCircle(member, membership, circle);
    if (exitCheck.shouldExit) {
      rotateOut.push(member.passport.id);
      reasons.push(`${member.passport.email}: ${exitCheck.reason}`);
    }
  }

  // Determine rotation type
  let rotationType: "partial" | "full" | "renewal";
  if (rotateOut.length === 0) {
    rotationType = "renewal";
  } else if (rotateOut.length >= members.length * 0.5) {
    rotationType = "full";
  } else {
    rotationType = "partial";
  }

  // Find suggested replacements
  const suggestedReplacements = findReplacements(
    members.filter(m => !rotateOut.includes(m.passport.id)),
    availablePool,
    rotateOut.length
  );

  return {
    circleId: circle.id,
    membersToRotateOut: rotateOut,
    suggestedReplacements,
    rotationType,
    reason: reasons.join("; ") || "Scheduled rotation",
  };
}

// =========================================================
// DISSOLUTION RULES
// =========================================================

export interface DissolutionCheck {
  shouldDissolve: boolean;
  reason?: string;
  canRecover: boolean;
  recoveryActions?: string[];
}

/**
 * Check if a circle should be dissolved
 */
export function shouldDissolveCircle(
  circle: Circle,
  members: MatchableFounder[],
  memberships: CircleMembership[]
): DissolutionCheck {
  const activeMembers = memberships.filter(m => m.active).length;

  // Below minimum size
  if (activeMembers < CIRCLE_CONFIG.SIZE.MIN) {
    return {
      shouldDissolve: true,
      reason: "Below minimum member count",
      canRecover: activeMembers >= 2,
      recoveryActions: ["Add new members to reach minimum"],
    };
  }

  // All members inactive
  const allInactive = members.every(m => {
    const lastActive = m.passport.last_active_at;
    return lastActive && daysSince(lastActive) > CIRCLE_CONFIG.ENGAGEMENT.WARNING_INACTIVE_DAYS;
  });

  if (allInactive) {
    return {
      shouldDissolve: true,
      reason: "All members inactive",
      canRecover: false,
    };
  }

  // Average trust too low
  const avgTrust = members.reduce((sum, m) => sum + m.passport.trust_score, 0) / members.length;
  if (avgTrust < CIRCLE_CONFIG.TRUST.MIN_CIRCLE_AVERAGE * 0.5) {
    return {
      shouldDissolve: true,
      reason: "Average trust score critically low",
      canRecover: false,
    };
  }

  return { shouldDissolve: false, canRecover: true };
}

// =========================================================
// FACILITATION MODEL
// =========================================================

export interface FacilitatorSelection {
  passportId: string;
  score: number;
  reasons: string[];
}

/**
 * Select the best facilitator for a circle
 * Human-light, Ark-assisted model
 */
export function selectFacilitator(
  members: MatchableFounder[]
): FacilitatorSelection | null {
  const candidates: FacilitatorSelection[] = [];

  for (const member of members) {
    // Must meet minimum trust threshold
    if (member.passport.trust_score < CIRCLE_CONFIG.TRUST.FACILITATOR_MIN_SCORE) {
      continue;
    }

    const reasons: string[] = [];
    let score = 0;

    // Trust score contribution
    score += member.passport.trust_score * 0.4;
    reasons.push(`Trust: ${member.passport.trust_score}`);

    // Mentor archetype bonus
    if (member.passport.archetype === "mentor") {
      score += 20;
      reasons.push("Mentor archetype");
    }

    // Connector archetype bonus
    if (member.passport.archetype === "connector") {
      score += 15;
      reasons.push("Connector archetype");
    }

    // Higher stage bonus (more experience)
    if (member.passport.project_stage === "scaling" || member.passport.project_stage === "growing") {
      score += 10;
      reasons.push("Experienced stage");
    }

    // High availability bonus
    if (member.passport.availability === "open") {
      score += 10;
      reasons.push("High availability");
    }

    // Willing to mentor intent
    if (member.passport.intent_signals.willing_to_mentor) {
      score += 15;
      reasons.push("Willing to mentor");
    }

    candidates.push({
      passportId: member.passport.id,
      score,
      reasons,
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  // Return highest scoring candidate
  return candidates.sort((a, b) => b.score - a.score)[0];
}

// =========================================================
// HELPER FUNCTIONS
// =========================================================

function countArchetypes(members: MatchableFounder[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of members) {
    const archetype = m.passport.archetype || "unknown";
    counts[archetype] = (counts[archetype] || 0) + 1;
  }
  return counts;
}

function countStages(members: MatchableFounder[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of members) {
    const stage = m.passport.project_stage || "unknown";
    counts[stage] = (counts[stage] || 0) + 1;
  }
  return counts;
}

function isTimezoneSpreadAcceptable(timezones: string[]): boolean {
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

  const tzOffsets = timezones.map(tz => offsets[tz] ?? 0);
  const minOffset = Math.min(...tzOffsets);
  const maxOffset = Math.max(...tzOffsets);
  const spread = maxOffset - minOffset;

  return spread <= CIRCLE_CONFIG.BALANCE.MAX_TIMEZONE_SPREAD_HOURS;
}

function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function findReplacements(
  remainingMembers: MatchableFounder[],
  pool: MatchableFounder[],
  count: number
): string[] {
  // Filter pool to exclude current members
  const remainingIds = new Set(remainingMembers.map(m => m.passport.id));
  const available = pool.filter(p => !remainingIds.has(p.passport.id));

  // Sort by trust score and return top candidates
  return available
    .sort((a, b) => b.passport.trust_score - a.passport.trust_score)
    .slice(0, count)
    .map(p => p.passport.id);
}
