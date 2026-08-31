// ---------------------------------------------------------------------------
// Founders North - Digests List API (Admin)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllDigests } from "@/lib/db";

export async function GET(request: NextRequest) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  try {
    const digests = await getAllDigests(50);
    return NextResponse.json(digests);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch digests",
      },
      { status: 500 }
    );
  }
}
