// =========================================================
// MICROFOUNDER NETWORK — MATCHING ENGINE
// Phase 4.3: Core matching algorithm
// =========================================================

import type { PassportSkill, PassportNeed } from "../types/passport";
import {
  type MatchableFounder,
  type MatchResult,
  type MatchScoreBreakdown,
  type DisqualifyResult,
  MATCH_WEIGHTS,
  STAGE_COMPATIBILITY,
  ARCHETYPE_COMPATIBILITY,
  AVAILABILITY_COMPATIBILITY,
  DISQUALIFIERS,
  calculateTimezoneScore,
} from "./types";

// =========================================================
// MATCHING ENGINE CLASS
// =========================================================

export class MatchingEngine {
  /**
   * Calculate match score between two founders
   */
  static calculateMatch(
    founder: MatchableFounder,
    candidate: MatchableFounder
  ): MatchResult {
    // Check disqualifiers first
    const disqualifyCheck = this.checkDisqualifiers(founder, candidate);
    if (disqualifyCheck.disqualified) {
      return {
        founderId: founder.passport.id,
        matchedFounderId: candidate.passport.id,
        score: 0,
        breakdown: this.emptyBreakdown(),
        matchReasons: [],
        disqualified: true,
        disqualifyReason: disqualifyCheck.reason,
        createdAt: new Date().toISOString(),
      };
    }

    // Calculate each dimension
    const breakdown = this.calculateBreakdown(founder, candidate);
    const matchReasons = this.generateMatchReasons(founder, candidate, breakdown);

    return {
      founderId: founder.passport.id,
      matchedFounderId: candidate.passport.id,
      score: Math.round(breakdown.total),
      breakdown,
      matchReasons,
      disqualified: false,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Find best matches for a founder from a pool
   */
  static findBestMatches(
    founder: MatchableFounder,
    pool: MatchableFounder[],
    limit: number = 10
  ): MatchResult[] {
    const matches = pool
      .filter((candidate) => candidate.passport.id !== founder.passport.id)
      .map((candidate) => this.calculateMatch(founder, candidate))
      .filter((match) => !match.disqualified && match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return matches;
  }

  /**
   * Check all disqualifiers
   */
  private static checkDisqualifiers(
    a: MatchableFounder,
    b: MatchableFounder
  ): DisqualifyResult {
    for (const check of Object.values(DISQUALIFIERS)) {
      const result = check(a, b);
      if (result.disqualified) {
        return result;
      }
    }
    return { disqualified: false };
  }

  /**
   * Calculate full score breakdown
   */
  private static calculateBreakdown(
    founder: MatchableFounder,
    candidate: MatchableFounder
  ): MatchScoreBreakdown {
    const needsOffersAlignment = this.calculateNeedsOffersScore(founder, candidate);
    const stageComplementarity = this.calculateStageScore(founder, candidate);
    const archetypeBalance = this.calculateArchetypeScore(founder, candidate);
    const timezoneProximity = this.calculateTimezoneProximityScore(founder, candidate);
    const availabilityMatch = this.calculateAvailabilityScore(founder, candidate);
    const intentAlignment = this.calculateIntentScore(founder, candidate);
    const trustBonus = this.calculateTrustBonus(founder, candidate);

    const rawTotal =
      needsOffersAlignment +
      stageComplementarity +
      archetypeBalance +
      timezoneProximity +
      availabilityMatch +
      intentAlignment +
      trustBonus;

    // Normalize to 0-100
    const maxPossible = Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0);
    const total = (rawTotal / maxPossible) * 100;

    return {
      needsOffersAlignment,
      stageComplementarity,
      archetypeBalance,
      timezoneProximity,
      availabilityMatch,
      intentAlignment,
      trustBonus,
      total,
    };
  }

  /**
   * Calculate needs/offers alignment score
   * This is the most important dimension
   */
  private static calculateNeedsOffersScore(
    founder: MatchableFounder,
    candidate: MatchableFounder
  ): number {
    let score = 0;
    const maxScore = MATCH_WEIGHTS.NEEDS_OFFERS;

    // Check if founder's needs match candidate's skills
    const founderNeedsMatched = this.countNeedsSkillsOverlap(
      founder.needs,
      candidate.skills
    );

    // Check if candidate's needs match founder's skills
    const candidateNeedsMatched = this.countNeedsSkillsOverlap(
      candidate.needs,
      founder.skills
    );

    // Mutual value exchange is best
    if (founderNeedsMatched > 0 && candidateNeedsMatched > 0) {
      // Both benefit - full score potential
      const mutualScore = Math.min(founderNeedsMatched + candidateNeedsMatched, 6);
      score = (mutualScore / 6) * maxScore;
    } else if (founderNeedsMatched > 0 || candidateNeedsMatched > 0) {
      // One-way value - partial score
      const oneWayScore = Math.max(founderNeedsMatched, candidateNeedsMatched);
      score = (oneWayScore / 6) * maxScore * 0.6;
    }

    return Math.round(score);
  }

  /**
   * Count how many needs match available skills
   */
  private static countNeedsSkillsOverlap(
    needs: PassportNeed[],
    skills: PassportSkill[]
  ): number {
    const skillSet = new Set(
      skills
        .filter((s) => s.willing_to_help)
        .map((s) => s.skill.toLowerCase())
    );

    return needs.filter(
      (n) => !n.fulfilled && skillSet.has(n.need.toLowerCase())
    ).length;
  }

  /**
   * Calculate stage complementarity score
   */
  private static calculateStageScore(
    founder: MatchableFounder,
    candidate: MatchableFounder
  ): number {
    const founderStage = founder.passport.project_stage;
    const candidateStage = candidate.passport.project_stage;

    if (!founderStage || !candidateStage) {
      return MATCH_WEIGHTS.STAGE_COMPLEMENTARITY * 0.5; // Neutral if unknown
    }

    const compatibility = STAGE_COMPATIBILITY[founderStage][candidateStage];
    return Math.round(compatibility * MATCH_WEIGHTS.STAGE_COMPLEMENTARITY);
  }

  /**
   * Calculate archetype balance score
   */
  private static calculateArchetypeScore(
    founder: MatchableFounder,
    candidate: MatchableFounder
  ): number {
    const founderArchetype = founder.passport.archetype;
    const candidateArchetype = candidate.passport.archetype;

    if (!founderArchetype || !candidateArchetype) {
      return MATCH_WEIGHTS.ARCHETYPE_BALANCE * 0.5; // Neutral if unknown
    }

    const compatibility = ARCHETYPE_COMPATIBILITY[founderArchetype][candidateArchetype];
    return Math.round(compatibility * MATCH_WEIGHTS.ARCHETYPE_BALANCE);
  }

  /**
   * Calculate timezone proximity score
   */
  private static calculateTimezoneProximityScore(
    founder: MatchableFounder,
    candidate: MatchableFounder
  ): number {
    const score = calculateTimezoneScore(
      founder.passport.timezone,
      candidate.passport.timezone
    );
    return Math.round(score * MATCH_WEIGHTS.TIMEZONE_PROXIMITY);
  }

  /**
   * Calculate availability match score
   */
  private static calculateAvailabilityScore(
    founder: MatchableFounder,
    candidate: MatchableFounder
  ): number {
    const founderAvail = founder.passport.availability;
    const candidateAvail = candidate.passport.availability;

    const compatibility = AVAILABILITY_COMPATIBILITY[founderAvail][candidateAvail];
    return Math.round(compatibility * MATCH_WEIGHTS.AVAILABILITY_MATCH);
  }

  /**
   * Calculate intent alignment score
   */
  private static calculateIntentScore(
    founder: MatchableFounder,
    candidate: MatchableFounder
  ): number {
    const founderIntents = founder.passport.intent_signals;
    const candidateIntents = candidate.passport.intent_signals;

    let overlaps = 0;
    let complementary = 0;

    // Check for overlapping intents
    for (const key of Object.keys(founderIntents)) {
      const typedKey = key as keyof typeof founderIntents;
      if (founderIntents[typedKey] && candidateIntents[typedKey]) {
        overlaps++;
      }
    }

    // Check for complementary intents (mentor/mentee)
    if (
      (founderIntents.seeking_mentorship && candidateIntents.willing_to_mentor) ||
      (founderIntents.willing_to_mentor && candidateIntents.seeking_mentorship)
    ) {
      complementary += 2;
    }

    // Check for collaboration match
    if (founderIntents.open_to_collaboration && candidateIntents.open_to_collaboration) {
      overlaps += 1;
    }

    const totalScore = Math.min(overlaps + complementary, 5);
    return Math.round((totalScore / 5) * MATCH_WEIGHTS.INTENT_ALIGNMENT);
  }

  /**
   * Calculate trust bonus
   */
  private static calculateTrustBonus(
    founder: MatchableFounder,
    candidate: MatchableFounder
  ): number {
    // Average trust scores, normalized
    const avgTrust =
      (founder.passport.trust_score + candidate.passport.trust_score) / 2;

    // Trust score is 0-100, normalize to weight
    const normalizedTrust = Math.min(avgTrust / 100, 1);
    return Math.round(normalizedTrust * MATCH_WEIGHTS.TRUST_BONUS);
  }

  /**
   * Generate human-readable match reasons
   */
  private static generateMatchReasons(
    founder: MatchableFounder,
    candidate: MatchableFounder,
    breakdown: MatchScoreBreakdown
  ): string[] {
    const reasons: string[] = [];

    // Needs/Offers alignment
    if (breakdown.needsOffersAlignment >= MATCH_WEIGHTS.NEEDS_OFFERS * 0.7) {
      reasons.push("Strong mutual value exchange potential");
    } else if (breakdown.needsOffersAlignment >= MATCH_WEIGHTS.NEEDS_OFFERS * 0.4) {
      reasons.push("Complementary skills and needs");
    }

    // Stage
    if (breakdown.stageComplementarity >= MATCH_WEIGHTS.STAGE_COMPLEMENTARITY * 0.8) {
      reasons.push(`Both at compatible stages (${founder.passport.project_stage}/${candidate.passport.project_stage})`);
    }

    // Archetype
    if (breakdown.archetypeBalance >= MATCH_WEIGHTS.ARCHETYPE_BALANCE * 0.8) {
      reasons.push(`Complementary archetypes (${founder.passport.archetype} + ${candidate.passport.archetype})`);
    }

    // Timezone
    if (breakdown.timezoneProximity >= MATCH_WEIGHTS.TIMEZONE_PROXIMITY * 0.8) {
      reasons.push("Great timezone overlap for meetings");
    }

    // Intent
    if (breakdown.intentAlignment >= MATCH_WEIGHTS.INTENT_ALIGNMENT * 0.7) {
      reasons.push("Aligned goals and intentions");
    }

    // Trust
    if (breakdown.trustBonus >= MATCH_WEIGHTS.TRUST_BONUS * 0.7) {
      reasons.push("Both have established trust in the network");
    }

    return reasons;
  }

  /**
   * Empty breakdown for disqualified matches
   */
  private static emptyBreakdown(): MatchScoreBreakdown {
    return {
      needsOffersAlignment: 0,
      stageComplementarity: 0,
      archetypeBalance: 0,
      timezoneProximity: 0,
      availabilityMatch: 0,
      intentAlignment: 0,
      trustBonus: 0,
      total: 0,
    };
  }
}
