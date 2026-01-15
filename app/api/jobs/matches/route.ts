// =========================================================
// MICROFOUNDER NETWORK — MATCH GENERATION API
// Trigger match generation jobs
// =========================================================

import { NextResponse } from "next/server";
import { runMatchGeneration, generateMatchesForPassport } from "../../../../lib/jobs";

// Secret key for job authorization (should be in env vars)
const JOB_SECRET = process.env.JOB_SECRET || "mf-job-secret-key";

/**
 * POST /api/jobs/matches
 * Trigger match generation
 * 
 * Body:
 * - passportId?: string - Generate matches for specific passport
 * - secret: string - Authorization key
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passportId, secret } = body;

    // Verify authorization
    if (secret !== JOB_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let result;

    if (passportId) {
      // Generate matches for specific passport
      result = await generateMatchesForPassport(passportId);
    } else {
      // Run full match generation
      result = await runMatchGeneration();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Match generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/matches
 * Get job status (for health checks)
 */
export async function GET() {
  return NextResponse.json({
    job: "match-generation",
    status: "ready",
    timestamp: new Date().toISOString(),
  });
}
