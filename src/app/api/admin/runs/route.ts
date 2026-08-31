// ---------------------------------------------------------------------------
// Founders North - Run Status API
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRun, getRecentRuns } from "@/lib/db";

// GET /api/admin/runs?id=xxx or GET /api/admin/runs (recent list)
export async function GET(request: NextRequest) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const run = await getRun(id);
      if (!run) {
        return NextResponse.json({ error: "Run not found" }, { status: 404 });
      }
      return NextResponse.json(run);
    }

    const runs = await getRecentRuns(20);
    return NextResponse.json(runs);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch runs",
      },
      { status: 500 }
    );
  }
}
