// ---------------------------------------------------------------------------
// Founders North - Single Category API (Admin)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { renameCategoryCascade, cascadeDeleteCategory } from "@/lib/integrity";
import { getCategoryBySlug } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  const { id } = await params;

  try {
    const category = await getCategoryBySlug(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch category" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  const { id } = await params;

  try {
    const body = await request.json();
    const newName = (body.name || "").trim();

    if (!newName) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const result = await renameCategoryCascade(id, newName);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  const { id } = await params;

  try {
    const result = await cascadeDeleteCategory(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete category" },
      { status: 500 }
    );
  }
}
