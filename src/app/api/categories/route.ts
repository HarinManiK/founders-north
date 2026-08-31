// ---------------------------------------------------------------------------
// Founders North - Public Categories API
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { getCategories } from "@/lib/db";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}
