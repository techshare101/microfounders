// =========================================================
// MICROFOUNDER NETWORK — CIRCLE ROTATION API
// Trigger circle rotation jobs
// =========================================================

import { NextResponse } from "next/server";
import { runCircleRotation, checkCircleHealth } from "../../../../lib/jobs";

const JOB_SECRET = process.env.JOB_SECRET || "mf-job-secret-key";

/**
 * POST /api/jobs/circles
 * Trigger circle rotation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret } = body;

    if (secret !== JOB_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await runCircleRotation();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Circle rotation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/circles
 * Get circle health status
 */
export async function GET() {
  try {
    const health = await checkCircleHealth();
    return NextResponse.json({
      job: "circle-rotation",
      status: "ready",
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      job: "circle-rotation",
      status: "error",
      timestamp: new Date().toISOString(),
    });
  }
}
