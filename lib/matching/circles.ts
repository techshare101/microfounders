// =========================================================
// MICROFOUNDER NETWORK — CIRCLE FORMATION ENGINE
// Phase 4.3: Circle formation and balancing logic
// =========================================================

import type { MatchableFounder, Circle, CircleMembership } from "./types";
import { CIRCLE_RULES, ARCHETYPE_COMPATIBILITY } from "./types";
import { MatchingEngine } from "./engine";

// =========================================================
// CIRCLE FORMATION ENGINE
// =========================================================

export class CircleFormationEngine {
  /**
   * Form a new circle from a pool of founders
   * Uses greedy algorithm with balance constraints
   */
  static formCircle(
    pool: MatchableFounder[],
    existingCircles: Circle[] = []
  ): {
    circle: Partial<Circle>;
    members: MatchableFounder[];
    score: number;
  } | null {
    if (pool.length < CIRCLE_RULES.MIN_MEMBERS) {
      return null;
    }

    // Filter out founders already in active circles
    const activeCircleMembers = new Set(
      existingCircles
        .filter((c) => c.status === "active" || c.status === "forming")
        .flatMap((c) => c.currentMembers)
    );

    const availablePool = pool.filter(
      (f) => !activeCircleMembers.has(f.passport.id)
    );

    if (availablePool.length < CIRCLE_RULES.MIN_MEMBERS) {
      return null;
    }

    // Start with highest trust founder as seed
    const sortedByTrust = [...availablePool].sort(
      (a, b) => b.passport.trust_score - a.passport.trust_score
    );

    const seed = sortedByTrust[0];
    const circleMembers: MatchableFounder[] = [seed];
    const remaining = sortedByTrust.slice(1);

    // Greedily add members that maximize circle quality
    while (
      circleMembers.length < CIRCLE_RULES.MAX_MEMBERS &&
      remaining.length > 0
    ) {
      const bestCandidate = this.findBestCandidateForCircle(
        circleMembers,
        remaining
      );

      if (!bestCandidate) break;

      circleMembers.push(bestCandidate.candidate);
      remaining.splice(remaining.indexOf(bestCandidate.candidate), 1);
    }

    // Check if circle meets minimum requirements
    if (circleMembers.length < CIRCLE_RULES.MIN_MEMBERS) {
      return null;
    }

    // Validate balance constraints
    if (!this.validateCircleBalance(circleMembers)) {
      return null;
    }

    const circleScore = this.calculateCircleScore(circleMembers);

    return {
      circle: {
        name: this.generateCircleName(circleMembers),
        status: "forming",
        maxMembers: CIRCLE_RULES.MAX_MEMBERS,
        currentMembers: circleMembers.map((m) => m.passport.id),
        createdAt: new Date().toISOString(),
        rotationDate: this.calculateRotationDate(),
        metadata: {
          formationScore: circleScore,
          archetypeDistribution: this.getArchetypeDistribution(circleMembers),
          stageDistribution: this.getStageDistribution(circleMembers),
        },
      },
      members: circleMembers,
      score: circleScore,
    };
  }

  /**
   * Find the best candidate to add to a forming circle
   */
  private static findBestCandidateForCircle(
    currentMembers: MatchableFounder[],
    candidates: MatchableFounder[]
  ): { candidate: MatchableFounder; score: number } | null {
    let bestCandidate: MatchableFounder | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      // Check if adding this candidate would break balance rules
      const testCircle = [...currentMembers, candidate];
      if (!this.wouldMaintainBalance(testCircle)) {
        continue;
      }

      // Calculate average match score with all current members
      let totalScore = 0;
      for (const member of currentMembers) {
        const match = MatchingEngine.calculateMatch(member, candidate);
        if (!match.disqualified) {
          totalScore += match.score;
        }
      }
      const avgScore = totalScore / currentMembers.length;

      // Add diversity bonus
      const diversityBonus = this.calculateDiversityBonus(testCircle);
      const finalScore = avgScore + diversityBonus;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestCandidate = candidate;
      }
    }

    return bestCandidate ? { candidate: bestCandidate, score: bestScore } : null;
  }

  /**
   * Check if adding a member would maintain balance constraints
   */
  private static wouldMaintainBalance(members: MatchableFounder[]): boolean {
    // Check stage distribution
    const stageCounts = new Map<string, number>();
    for (const m of members) {
      const stage = m.passport.project_stage || "unknown";
      stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1);
    }
    for (const count of stageCounts.values()) {
      if (count > CIRCLE_RULES.MAX_SAME_STAGE) {
        return false;
      }
    }

    // Check timezone spread
    const timezones = members.map((m) => m.passport.timezone);
    if (!this.isTimezoneSpreadAcceptable(timezones)) {
      return false;
    }

    return true;
  }

  /**
   * Validate final circle balance
   */
  private static validateCircleBalance(members: MatchableFounder[]): boolean {
    // Check archetype diversity
    const archetypes = new Set(
      members.map((m) => m.passport.archetype).filter(Boolean)
    );
    if (archetypes.size < CIRCLE_RULES.MIN_ARCHETYPE_DIVERSITY) {
      return false;
    }

    return this.wouldMaintainBalance(members);
  }

  /**
   * Check if timezone spread is acceptable
   */
  private static isTimezoneSpreadAcceptable(timezones: string[]): boolean {
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

    const tzOffsets = timezones.map((tz) => offsets[tz] ?? 0);
    const minOffset = Math.min(...tzOffsets);
    const maxOffset = Math.max(...tzOffsets);
    const spread = maxOffset - minOffset;

    return spread <= CIRCLE_RULES.MAX_TIMEZONE_SPREAD;
  }

  /**
   * Calculate diversity bonus for a circle
   */
  private static calculateDiversityBonus(members: MatchableFounder[]): number {
    let bonus = 0;

    // Archetype diversity bonus
    const archetypes = new Set(
      members.map((m) => m.passport.archetype).filter(Boolean)
    );
    bonus += archetypes.size * 3;

    // Stage diversity bonus
    const stages = new Set(
      members.map((m) => m.passport.project_stage).filter(Boolean)
    );
    bonus += stages.size * 2;

    return bonus;
  }

  /**
   * Calculate overall circle quality score
   */
  private static calculateCircleScore(members: MatchableFounder[]): number {
    let totalMatchScore = 0;
    let matchCount = 0;

    // Calculate pairwise match scores
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const match = MatchingEngine.calculateMatch(members[i], members[j]);
        if (!match.disqualified) {
          totalMatchScore += match.score;
          matchCount++;
        }
      }
    }

    const avgMatchScore = matchCount > 0 ? totalMatchScore / matchCount : 0;
    const diversityBonus = this.calculateDiversityBonus(members);

    return Math.round(avgMatchScore + diversityBonus);
  }

  /**
   * Generate a circle name based on members
   */
  private static generateCircleName(members: MatchableFounder[]): string {
    const archetypes = members
      .map((m) => m.passport.archetype)
      .filter(Boolean);

    const dominantArchetype = this.getMostCommon(archetypes);
    const stages = members
      .map((m) => m.passport.project_stage)
      .filter(Boolean);
    const dominantStage = this.getMostCommon(stages);

    const prefixes = [
      "Forge",
      "Craft",
      "Build",
      "Shape",
      "Form",
      "Create",
      "Design",
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

    return `${prefix} Circle ${Date.now().toString(36).slice(-4).toUpperCase()}`;
  }

  /**
   * Get most common element in array
   */
  private static getMostCommon<T>(arr: T[]): T | undefined {
    const counts = new Map<T, number>();
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    let maxCount = 0;
    let mostCommon: T | undefined;
    for (const [item, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }
    return mostCommon;
  }

  /**
   * Calculate rotation date (90 days from now)
   */
  private static calculateRotationDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + CIRCLE_RULES.ROTATION_CADENCE);
    return date.toISOString();
  }

  /**
   * Get archetype distribution for metadata
   */
  private static getArchetypeDistribution(
    members: MatchableFounder[]
  ): Record<string, number> {
    const dist: Record<string, number> = {};
    for (const m of members) {
      const archetype = m.passport.archetype || "unknown";
      dist[archetype] = (dist[archetype] || 0) + 1;
    }
    return dist;
  }

  /**
   * Get stage distribution for metadata
   */
  private static getStageDistribution(
    members: MatchableFounder[]
  ): Record<string, number> {
    const dist: Record<string, number> = {};
    for (const m of members) {
      const stage = m.passport.project_stage || "unknown";
      dist[stage] = (dist[stage] || 0) + 1;
    }
    return dist;
  }

  /**
   * Check if a circle needs rotation
   */
  static needsRotation(circle: Circle): boolean {
    if (!circle.rotationDate) return false;
    return new Date(circle.rotationDate) <= new Date();
  }

  /**
   * Suggest members to rotate out (lowest engagement)
   */
  static suggestRotationCandidates(
    circle: Circle,
    memberships: CircleMembership[],
    passports: MatchableFounder[]
  ): string[] {
    // In a real implementation, this would consider:
    // - Activity levels
    // - Meeting attendance
    // - Contribution scores
    // For now, return empty (no forced rotation)
    return [];
  }
}
