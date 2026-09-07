// ---------------------------------------------------------------------------
// Founders North - Admin Subscribers API
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSubscribersCount, getAllSubscribers } from "@/lib/db";

export async function GET(request: NextRequest) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  try {
    const [count, subscribers] = await Promise.all([
      getSubscribersCount(),
      getAllSubscribers(100),
    ]);

    return NextResponse.json({ count, subscribers });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load subscribers",
      },
      { status: 500 }
    );
  }
}
