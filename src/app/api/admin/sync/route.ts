// ---------------------------------------------------------------------------
// Founders North - Database Validation & Sync API (Admin)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { validateAndSyncDatabase } from "@/lib/integrity";

export async function POST(request: NextRequest) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  try {
    const report = await validateAndSyncDatabase();
    return NextResponse.json({
      success: true,
      message: "Database relationships and counts synchronized successfully.",
      report,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to synchronize database relationships",
      },
      { status: 500 }
    );
  }
}
