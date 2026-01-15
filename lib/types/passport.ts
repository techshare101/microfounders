// =========================================================
// MICROFOUNDER NETWORK — FOUNDER PASSPORT TYPES
// Phase 4.1: TypeScript types for the Ark Engine
// =========================================================

// Project Stage
export type ProjectStage = 
  | 'idea' 
  | 'building' 
  | 'launched' 
  | 'growing' 
  | 'scaling' 
  | 'paused';

// Availability
export type Availability = 
  | 'open' 
  | 'limited' 
  | 'focused' 
  | 'unavailable';

// Founder Archetype
export type Archetype = 
  | 'builder'      // Loves shipping, hands-on
  | 'strategist'   // Big picture, systems thinker
  | 'connector'    // Brings people together
  | 'specialist'   // Deep expertise in one area
  | 'generalist'   // Jack of all trades
  | 'mentor'       // Experienced, wants to guide
  | 'explorer';    // Early stage, learning

// Passport Status
export type PassportStatus = 
  | 'pending' 
  | 'active' 
  | 'paused' 
  | 'alumni';

// Membership Tier
export type MembershipTier = 
  | 'founding' 
  | 'member' 
  | 'resident' 
  | 'alumni';

// Skill Proficiency
export type SkillProficiency = 
  | 'learning' 
  | 'competent' 
  | 'proficient' 
  | 'expert';

// Need Priority
export type NeedPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

// Intent Signals
export interface IntentSignals {
  seeking_cofounder?: boolean;
  open_to_collaboration?: boolean;
  looking_for_feedback?: boolean;
  wants_accountability?: boolean;
  seeking_mentorship?: boolean;
  willing_to_mentor?: boolean;
  interested_in_circles?: boolean;
}

// Founder Passport
export interface FounderPassport {
  id: string;
  invite_request_id: string | null;
  
  // Identity
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  
  // What they're building
  current_project: string | null;
  project_stage: ProjectStage | null;
  project_url: string | null;
  
  // Availability & Timezone
  timezone: string;
  availability: Availability;
  weekly_hours_available: number | null;
  
  // Archetype
  archetype: Archetype | null;
  
  // Intent signals
  intent_signals: IntentSignals;
  
  // Membership status
  status: PassportStatus;
  tier: MembershipTier;
  
  // Trust & Activity
  trust_score: number;
  last_active_at: string | null;
  
  // Metadata
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

// Passport Skill
export interface PassportSkill {
  id: string;
  passport_id: string;
  skill: string;
  proficiency: SkillProficiency;
  willing_to_help: boolean;
  created_at: string;
}

// Passport Need
export interface PassportNeed {
  id: string;
  passport_id: string;
  need: string;
  priority: NeedPriority;
  description: string | null;
  fulfilled: boolean;
  created_at: string;
}

// Invite Request Status
export type InviteStatus = 
  | 'pending' 
  | 'reviewing' 
  | 'approved' 
  | 'declined' 
  | 'waitlisted';

// Invite Request (updated with review fields)
export interface InviteRequest {
  id: string;
  email: string;
  what_building: string | null;
  created_at: string;
  source: string;
  status: InviteStatus;
  
  // Review fields
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  signal_score: number;
  tier_assigned: MembershipTier | 'waitlist' | null;
  passport_id: string | null;
}

// Full Passport with relations
export interface FullPassport extends FounderPassport {
  skills: PassportSkill[];
  needs: PassportNeed[];
}
