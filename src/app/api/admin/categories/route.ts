// ---------------------------------------------------------------------------
// Founders North - Categories API (Admin)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  recountCategoryArticles,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  try {
    const body = await request.json();
    const { name, slug, action, id, updates } = body;

    if (action === "create") {
      const catSlug =
        slug ||
        name
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
      const catId = await createCategory(name, catSlug);
      return NextResponse.json({ id: catId, success: true });
    }

    if (action === "update" && id) {
      await updateCategory(id, updates);
      return NextResponse.json({ success: true });
    }

    if (action === "delete" && id) {
      await deleteCategory(id);
      return NextResponse.json({ success: true });
    }

    if (action === "recount" && id) {
      const count = await recountCategoryArticles(id);
      return NextResponse.json({ count, success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to manage categories",
      },
      { status: 500 }
    );
  }
}
