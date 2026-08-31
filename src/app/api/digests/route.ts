// ---------------------------------------------------------------------------
// Founders North - Public Digests API
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { getAllDigests, getLatestDigest } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  try {
    if (type === "latest") {
      const digest = await getLatestDigest();
      return NextResponse.json(digest);
    }

    const digests = await getAllDigests(30);
    // Only return published ones for public API
    const published = digests.filter((d) => d.status === "published");
    return NextResponse.json(published);
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
