// ---------------------------------------------------------------------------
// Founders North - Pipeline Trigger API
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createRun } from "@/lib/db";
import { executePipeline } from "@/lib/pipeline/runner";
import type { PipelineRun } from "@/types";

export async function POST(request: NextRequest) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  try {
    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

    // Start the pipeline in the background (fire-and-forget).
    // The pipeline writes all progress to Firestore directly.
    // We intentionally do NOT await this - it runs in the background.
    executePipeline(runId).catch((err) => {
      console.error(`Pipeline ${runId} crashed:`, err);
    });

    return NextResponse.json({ runId, status: "queued" });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to trigger pipeline",
      },
      { status: 500 }
    );
  }
}
