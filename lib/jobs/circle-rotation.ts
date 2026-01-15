// =========================================================
// MICROFOUNDER NETWORK — CIRCLE ROTATION JOB
// Automated circle lifecycle management
// =========================================================

import { createClient } from "@supabase/supabase-js";
import { CIRCLE_CONFIG } from "../matching/circle-rules";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xshyzyewarjrpabwpdpc.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export interface CircleRotationResult {
  success: boolean;
  circlesProcessed: number;
  circlesRotated: number;
  circlesDissolved: number;
  errors: string[];
  timestamp: string;
}

interface CircleData {
  id: string;
  name: string;
  status: string;
  rotation_cadence_days: number;
  formed_at: string;
  last_rotation_at: string | null;
  member_count: number;
}

/**
 * Check if a circle is due for rotation
 */
function isDueForRotation(circle: CircleData): boolean {
  const lastRotation = circle.last_rotation_at 
    ? new Date(circle.last_rotation_at) 
    : new Date(circle.formed_at);
  
  const daysSinceRotation = Math.floor(
    (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceRotation >= circle.rotation_cadence_days;
}

/**
 * Check if a circle should be dissolved
 */
function shouldDissolve(circle: CircleData): boolean {
  // Dissolve if below minimum size
  if (circle.member_count < CIRCLE_CONFIG.SIZE.MIN) {
    return true;
  }
  return false;
}

/**
 * Process circle rotation
 */
async function rotateCircle(circleId: string): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Update rotation timestamp
  const { error } = await supabase
    .from("mf_circles")
    .update({
      last_rotation_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", circleId);

  if (error) {
    console.error("Error rotating circle:", error);
    return false;
  }

  // Create activity record
  await supabase.from("mf_activity").insert({
    activity_type: "circle_rotated",
    circle_id: circleId,
    metadata: { rotated_at: new Date().toISOString() },
  });

  return true;
}

/**
 * Dissolve a circle
 */
async function dissolveCircle(circleId: string, reason: string): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Update circle status
  const { error: circleError } = await supabase
    .from("mf_circles")
    .update({
      status: "dissolved",
      dissolved_at: new Date().toISOString(),
      dissolution_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", circleId);

  if (circleError) {
    console.error("Error dissolving circle:", circleError);
    return false;
  }

  // Update all memberships to inactive
  await supabase
    .from("mf_circle_members")
    .update({
      status: "inactive",
      left_at: new Date().toISOString(),
    })
    .eq("circle_id", circleId)
    .eq("status", "active");

  // Create activity record
  await supabase.from("mf_activity").insert({
    activity_type: "circle_dissolved",
    circle_id: circleId,
    metadata: { reason, dissolved_at: new Date().toISOString() },
  });

  return true;
}

/**
 * Main circle rotation job
 */
export async function runCircleRotation(): Promise<CircleRotationResult> {
  const result: CircleRotationResult = {
    success: true,
    circlesProcessed: 0,
    circlesRotated: 0,
    circlesDissolved: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch active circles with member counts
    const { data: circles, error } = await supabase
      .from("mf_circles")
      .select(`
        id,
        name,
        status,
        rotation_cadence_days,
        formed_at,
        last_rotation_at
      `)
      .eq("status", "active");

    if (error) {
      result.success = false;
      result.errors.push("Failed to fetch circles");
      return result;
    }

    // Get member counts for each circle
    for (const circle of circles || []) {
      result.circlesProcessed++;

      const { count } = await supabase
        .from("mf_circle_members")
        .select("id", { count: "exact", head: true })
        .eq("circle_id", circle.id)
        .eq("status", "active");

      const circleWithCount: CircleData = {
        ...circle,
        rotation_cadence_days: circle.rotation_cadence_days || CIRCLE_CONFIG.ROTATION.STANDARD_CADENCE,
        member_count: count || 0,
      };

      // Check for dissolution first
      if (shouldDissolve(circleWithCount)) {
        const dissolved = await dissolveCircle(circle.id, "Below minimum member count");
        if (dissolved) {
          result.circlesDissolved++;
        }
        continue;
      }

      // Check for rotation
      if (isDueForRotation(circleWithCount)) {
        const rotated = await rotateCircle(circle.id);
        if (rotated) {
          result.circlesRotated++;
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
 * Check circle health and send alerts
 */
export async function checkCircleHealth(): Promise<{
  healthy: number;
  atRisk: number;
  critical: number;
}> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const stats = { healthy: 0, atRisk: 0, critical: 0 };

  const { data: circles } = await supabase
    .from("mf_circles")
    .select("id")
    .eq("status", "active");

  for (const circle of circles || []) {
    const { count } = await supabase
      .from("mf_circle_members")
      .select("id", { count: "exact", head: true })
      .eq("circle_id", circle.id)
      .eq("status", "active");

    const memberCount = count || 0;

    if (memberCount >= CIRCLE_CONFIG.SIZE.IDEAL) {
      stats.healthy++;
    } else if (memberCount >= CIRCLE_CONFIG.SIZE.MIN) {
      stats.atRisk++;
    } else {
      stats.critical++;
    }
  }

  return stats;
}
