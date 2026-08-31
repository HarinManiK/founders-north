// ---------------------------------------------------------------------------
// Founders North - Public Articles API
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { getPublishedArticles, getTopArticles } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "recent";
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    if (type === "top") {
      const days = parseInt(searchParams.get("days") || "7", 10);
      const articles = await getTopArticles(days, limit);
      return NextResponse.json(articles);
    }

    const articles = await getPublishedArticles(limit);
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
