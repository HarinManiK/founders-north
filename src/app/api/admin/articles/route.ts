// ---------------------------------------------------------------------------
// Founders North - Articles List API (Admin)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllArticles } from "@/lib/db";

export async function GET(request: NextRequest) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  try {
    const articles = await getAllArticles(100);
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch articles",
      },
      { status: 500 }
    );
  }
}
