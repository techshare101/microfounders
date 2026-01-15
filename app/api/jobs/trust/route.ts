// =========================================================
// MICROFOUNDER NETWORK — TRUST DECAY API
// Trigger trust decay jobs
// =========================================================

import { NextResponse } from "next/server";
import { runTrustDecay, getTrustDistribution } from "../../../../lib/jobs";

const JOB_SECRET = process.env.JOB_SECRET || "mf-job-secret-key";

/**
 * POST /api/jobs/trust
 * Trigger trust decay job
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

    const result = await runTrustDecay();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Trust decay error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/trust
 * Get trust distribution
 */
export async function GET() {
  try {
    const distribution = await getTrustDistribution();
    return NextResponse.json({
      job: "trust-decay",
      status: "ready",
      distribution,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      job: "trust-decay",
      status: "error",
      timestamp: new Date().toISOString(),
    });
  }
}
