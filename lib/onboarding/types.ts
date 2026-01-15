// =========================================================
// MICROFOUNDER NETWORK — ONBOARDING TYPES
// Phase 4.5: Member onboarding flow
// =========================================================

import type { 
  Archetype, 
  ProjectStage, 
  Availability,
  IntentSignals 
} from "../types/passport";

// =========================================================
// ONBOARDING STEPS
// =========================================================

export type OnboardingStep =
  | "welcome"           // Welcome message, set expectations
  | "identity"          // Name, bio, avatar
  | "project"           // What they're building
  | "stage"             // Project stage
  | "skills"            // Skills they offer
  | "needs"             // What they're seeking
  | "availability"      // Timezone, hours, availability
  | "archetype"         // Founder personality
  | "intent"            // Intent signals
  | "review"            // Review all info
  | "complete";         // Onboarding complete

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "welcome",
  "identity",
  "project",
  "stage",
  "skills",
  "needs",
  "availability",
  "archetype",
  "intent",
  "review",
  "complete",
];

// =========================================================
// STEP METADATA
// =========================================================

export interface StepMetadata {
  step: OnboardingStep;
  title: string;
  subtitle: string;
  required: boolean;
  estimatedMinutes: number;
}

export const STEP_METADATA: Record<OnboardingStep, StepMetadata> = {
  welcome: {
    step: "welcome",
    title: "Welcome to the Network",
    subtitle: "A few things before we begin",
    required: true,
    estimatedMinutes: 1,
  },
  identity: {
    step: "identity",
    title: "Who You Are",
    subtitle: "How you'll appear to other founders",
    required: true,
    estimatedMinutes: 2,
  },
  project: {
    step: "project",
    title: "What You're Building",
    subtitle: "Tell us about your current focus",
    required: true,
    estimatedMinutes: 2,
  },
  stage: {
    step: "stage",
    title: "Your Stage",
    subtitle: "Where you are in your journey",
    required: true,
    estimatedMinutes: 1,
  },
  skills: {
    step: "skills",
    title: "What You Offer",
    subtitle: "Skills you can share with others",
    required: true,
    estimatedMinutes: 2,
  },
  needs: {
    step: "needs",
    title: "What You Seek",
    subtitle: "Where you could use support",
    required: true,
    estimatedMinutes: 2,
  },
  availability: {
    step: "availability",
    title: "Your Availability",
    subtitle: "When you can connect",
    required: true,
    estimatedMinutes: 1,
  },
  archetype: {
    step: "archetype",
    title: "Your Style",
    subtitle: "How you operate as a founder",
    required: false,
    estimatedMinutes: 1,
  },
  intent: {
    step: "intent",
    title: "Your Intent",
    subtitle: "What you're looking for in the network",
    required: true,
    estimatedMinutes: 1,
  },
  review: {
    step: "review",
    title: "Review",
    subtitle: "Confirm your profile",
    required: true,
    estimatedMinutes: 1,
  },
  complete: {
    step: "complete",
    title: "You're In",
    subtitle: "Welcome to MicroFounder Network",
    required: true,
    estimatedMinutes: 0,
  },
};

// =========================================================
// ONBOARDING STATE
// =========================================================

export interface OnboardingState {
  passportId: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  startedAt: string;
  lastUpdatedAt: string;
  data: OnboardingData;
}

export interface OnboardingData {
  // Identity
  displayName?: string;
  bio?: string;
  avatarUrl?: string;

  // Project
  currentProject?: string;
  projectUrl?: string;
  projectStage?: ProjectStage;

  // Skills (what they offer)
  skills?: SkillEntry[];

  // Needs (what they seek)
  needs?: NeedEntry[];

  // Availability
  timezone?: string;
  availability?: Availability;
  weeklyHoursAvailable?: number;

  // Archetype
  archetype?: Archetype;

  // Intent
  intentSignals?: IntentSignals;
}

export interface SkillEntry {
  skill: string;
  proficiency: "learning" | "competent" | "proficient" | "expert";
  willingToHelp: boolean;
}

export interface NeedEntry {
  need: string;
  priority: "low" | "medium" | "high" | "urgent";
  description?: string;
}

// =========================================================
// PREDEFINED OPTIONS
// =========================================================

export const SKILL_OPTIONS = [
  "Product Strategy",
  "UI/UX Design",
  "Frontend Development",
  "Backend Development",
  "Mobile Development",
  "DevOps / Infrastructure",
  "Data Science / ML",
  "Marketing",
  "Sales",
  "Fundraising",
  "Legal / Compliance",
  "Operations",
  "Customer Success",
  "Content / Writing",
  "Community Building",
  "Hiring / HR",
  "Finance / Accounting",
] as const;

export const NEED_OPTIONS = [
  "Technical Co-founder",
  "Business Co-founder",
  "Product Feedback",
  "Technical Advice",
  "Marketing Strategy",
  "Sales Guidance",
  "Fundraising Help",
  "Accountability Partner",
  "Industry Connections",
  "Mentorship",
  "Design Review",
  "Code Review",
  "User Testing",
  "Hiring Advice",
  "Legal Guidance",
] as const;

export const TIMEZONE_OPTIONS = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central Europe (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "UTC", label: "UTC" },
] as const;

export const ARCHETYPE_OPTIONS: { value: Archetype; label: string; description: string }[] = [
  { value: "builder", label: "Builder", description: "You love shipping. Hands-on, always making." },
  { value: "strategist", label: "Strategist", description: "Big picture thinker. Systems and vision." },
  { value: "connector", label: "Connector", description: "You bring people together. Network is your strength." },
  { value: "specialist", label: "Specialist", description: "Deep expertise in one area. The go-to expert." },
  { value: "generalist", label: "Generalist", description: "Jack of all trades. Adaptable and versatile." },
  { value: "mentor", label: "Mentor", description: "Experienced. You want to guide others." },
  { value: "explorer", label: "Explorer", description: "Early stage. Learning and discovering." },
];

export const STAGE_OPTIONS: { value: ProjectStage; label: string; description: string }[] = [
  { value: "idea", label: "Idea", description: "Exploring concepts, validating problem" },
  { value: "building", label: "Building", description: "Actively developing the product" },
  { value: "launched", label: "Launched", description: "Product is live, getting first users" },
  { value: "growing", label: "Growing", description: "Finding product-market fit, scaling users" },
  { value: "scaling", label: "Scaling", description: "Proven model, expanding rapidly" },
  { value: "paused", label: "Paused", description: "Taking a break, between projects" },
];

export const AVAILABILITY_OPTIONS: { value: Availability; label: string; description: string }[] = [
  { value: "open", label: "Open", description: "Actively looking to connect" },
  { value: "limited", label: "Limited", description: "Available for select opportunities" },
  { value: "focused", label: "Focused", description: "Heads down, minimal availability" },
  { value: "unavailable", label: "Unavailable", description: "Not available right now" },
];

// =========================================================
// VALIDATION
// =========================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateStep(step: OnboardingStep, data: OnboardingData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (step) {
    case "identity":
      if (!data.displayName || data.displayName.trim().length < 2) {
        errors.push("Display name is required (at least 2 characters)");
      }
      if (!data.bio) {
        warnings.push("A bio helps others understand you better");
      }
      break;

    case "project":
      if (!data.currentProject || data.currentProject.trim().length < 5) {
        errors.push("Please describe what you're building (at least 5 characters)");
      }
      break;

    case "stage":
      if (!data.projectStage) {
        errors.push("Please select your current stage");
      }
      break;

    case "skills":
      if (!data.skills || data.skills.length === 0) {
        errors.push("Please add at least one skill you can offer");
      }
      break;

    case "needs":
      if (!data.needs || data.needs.length === 0) {
        errors.push("Please add at least one thing you're seeking");
      }
      break;

    case "availability":
      if (!data.timezone) {
        errors.push("Please select your timezone");
      }
      if (!data.availability) {
        errors.push("Please select your availability level");
      }
      break;

    case "intent":
      if (!data.intentSignals || Object.keys(data.intentSignals).length === 0) {
        errors.push("Please select at least one intent");
      }
      break;

    case "review":
      // Validate all required fields
      const identityCheck = validateStep("identity", data);
      const projectCheck = validateStep("project", data);
      const stageCheck = validateStep("stage", data);
      const skillsCheck = validateStep("skills", data);
      const needsCheck = validateStep("needs", data);
      const availabilityCheck = validateStep("availability", data);
      const intentCheck = validateStep("intent", data);

      errors.push(
        ...identityCheck.errors,
        ...projectCheck.errors,
        ...stageCheck.errors,
        ...skillsCheck.errors,
        ...needsCheck.errors,
        ...availabilityCheck.errors,
        ...intentCheck.errors
      );
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =========================================================
// PROGRESS CALCULATION
// =========================================================

export function calculateProgress(state: OnboardingState): number {
  const totalSteps = ONBOARDING_STEPS.length - 1; // Exclude 'complete'
  const currentIndex = ONBOARDING_STEPS.indexOf(state.currentStep);
  return Math.round((currentIndex / totalSteps) * 100);
}

export function getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex >= ONBOARDING_STEPS.length - 1) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex + 1];
}

export function getPreviousStep(currentStep: OnboardingStep): OnboardingStep | null {
  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex - 1];
}
