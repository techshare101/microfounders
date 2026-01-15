// =========================================================
// MICROFOUNDER NETWORK — FOUNDER OVERRIDE
// Lifetime unrestricted access for system operators
// =========================================================

/**
 * Founder Override Emails
 * These users have permanent, unrestricted access to all system features.
 * This bypasses:
 * - Onboarding requirements
 * - Trust decay
 * - Matching limits
 * - Access gates
 * - Circle rotation rules
 * 
 * This is non-transferable and exists to ensure system continuity,
 * governance, and evolution.
 */
export const FOUNDER_OVERRIDE_EMAILS = [
  "kojo@metalmindtech.com",
  "kesarel@metalmindtech.com",
  "valentin2v2000@gmail.com",
] as const;

/**
 * Check if an email has founder override privileges
 */
export function hasFounderOverride(email: string | null | undefined): boolean {
  if (!email) return false;
  return FOUNDER_OVERRIDE_EMAILS.includes(email.toLowerCase() as typeof FOUNDER_OVERRIDE_EMAILS[number]);
}

/**
 * Founder override permissions
 * When true, the user bypasses all restrictions
 */
export interface FounderOverrideResult {
  isFounder: boolean;
  bypassOnboarding: boolean;
  bypassTrustDecay: boolean;
  bypassMatchLimits: boolean;
  bypassCircleRules: boolean;
  bypassAccessGates: boolean;
  fullAdminAccess: boolean;
}

/**
 * Get full founder override permissions for an email
 */
export function getFounderOverride(email: string | null | undefined): FounderOverrideResult {
  const isFounder = hasFounderOverride(email);
  
  return {
    isFounder,
    bypassOnboarding: isFounder,
    bypassTrustDecay: isFounder,
    bypassMatchLimits: isFounder,
    bypassCircleRules: isFounder,
    bypassAccessGates: isFounder,
    fullAdminAccess: isFounder,
  };
}
