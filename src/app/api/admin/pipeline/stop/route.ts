// ---------------------------------------------------------------------------
// Founders North - Pipeline Stop & Rollback API
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { updateRunStatus, appendRunLog, rollbackRun, getRun } from "@/lib/db";

export async function POST(request: NextRequest) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  try {
    const body = await request.json();
    const { runId } = body;

    if (!runId) {
      return NextResponse.json({ error: "Missing runId" }, { status: 400 });
    }

    const run = await getRun(runId);
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Mark as cancelRequested and cancelled
    await updateRunStatus(runId, "cancelled", "cancelled", {
      cancelRequested: true,
      completedAt: new Date().toISOString(),
    });

    await appendRunLog(runId, {
      timestamp: new Date().toISOString(),
      level: "warn",
      message: "[STOP] Run stop requested by admin. Initiating immediate rollback...",
    });

    // Execute rollback of any created articles or digests
    const { deletedArticles, deletedDigests } = await rollbackRun(runId);

    await appendRunLog(runId, {
      timestamp: new Date().toISOString(),
      level: "info",
      message: `[ROLLBACK COMPLETE] Removed ${deletedArticles} created articles and ${deletedDigests} digests. Run terminated cleanly.`,
    });

    return NextResponse.json({
      success: true,
      message: `Run stopped and rolled back successfully (${deletedArticles} articles, ${deletedDigests} digests removed).`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to stop run",
      },
      { status: 500 }
    );
  }
}
