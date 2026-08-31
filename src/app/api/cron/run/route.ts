// ---------------------------------------------------------------------------
// Founders North - Automated Cron Trigger API (7:30 AM IST Automation Ready)
// ---------------------------------------------------------------------------
// Can be triggered by Vercel Cron, GitHub Actions, or cron-job.org
// Authorization: Bearer <CRON_SECRET> header or ?key=<CRON_SECRET> query param
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { createRun } from "@/lib/db";
import { executePipeline } from "@/lib/pipeline/runner";
import type { PipelineRun } from "@/types";

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const keyParam = searchParams.get("key");

  // If CRON_SECRET is set in environment, require authorization
  if (cronSecret) {
    const isBearerValid = authHeader === `Bearer ${cronSecret}`;
    const isParamValid = keyParam === cronSecret;
    if (!isBearerValid && !isParamValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const runId = `cron-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const run: PipelineRun = {
      id: runId,
      status: "queued",
      currentStage: "queued",
      startedAt: new Date().toISOString(),
      emailsProcessed: 0,
      newslettersIdentified: 0,
      articlesGenerated: 0,
    };

    await createRun(run);

    // Run in background (fire-and-forget)
    executePipeline(runId).catch((err) => {
      console.error(`Automated cron run ${runId} failed:`, err);
    });

    return NextResponse.json({
      message: "Automated pipeline run initiated",
      runId,
      status: "queued",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initiate automated run",
      },
      { status: 500 }
    );
  }
}
