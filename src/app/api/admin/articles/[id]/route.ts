// ---------------------------------------------------------------------------
// Founders North - Single Article API (Admin)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getArticle, updateArticle } from "@/lib/db";
import { syncArticleStatus, cascadeDeleteArticle, syncCategoryState } from "@/lib/integrity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  const { id } = await params;

  try {
    const article = await getArticle(id);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch article" },
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
    const existing = await getArticle(id);
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = [
      "title",
      "slug",
      "excerpt",
      "content",
      "keyTakeaways",
      "categoryId",
      "categoryName",
      "status",
      "importanceScore",
      "isFeatured",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (body.status === "published" && !existing.publishedAt) {
      updates.publishedAt = new Date().toISOString();
    }

    await updateArticle(id, updates);

    // If status changed, perform cascading sync with digests and categories
    if (body.status && body.status !== existing.status) {
      await syncArticleStatus(id, body.status as "published" | "draft");
    } else if (body.categoryId && body.categoryId !== existing.categoryId) {
      // If category changed, sync both old and new category counts
      if (existing.categoryId) await syncCategoryState(existing.categoryId);
      await syncCategoryState(body.categoryId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update article" },
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
    const result = await cascadeDeleteArticle(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete article" },
      { status: 500 }
    );
  }
}
