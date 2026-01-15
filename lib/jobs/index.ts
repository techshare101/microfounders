// =========================================================
// MICROFOUNDER NETWORK — JOB EXPORTS
// Background automation jobs
// =========================================================

export {
  runMatchGeneration,
  generateMatchesForPassport,
  type MatchGenerationResult,
} from "./match-generator";

export {
  runCircleRotation,
  checkCircleHealth,
  type CircleRotationResult,
} from "./circle-rotation";

export {
  runTrustDecay,
  boostTrustForAction,
  getTrustDistribution,
  type TrustDecayResult,
} from "./trust-decay";
