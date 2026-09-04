// ---------------------------------------------------------------------------
// Founders North - Pipeline Trigger API (Dispatches to GitHub Actions Runner)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSettings, createRun } from "@/lib/db";
import type { PipelineRun } from "@/types";

const DEFAULT_GITHUB_REPO = "HarinManiK/founders-north";

export async function POST(request: NextRequest) {
  const errorResp = await requireAdmin(request.headers.get("cookie"));
  if (errorResp) return errorResp;

  try {
    const settings = await getSettings();
    const githubToken = (
      process.env.GITHUB_PAT ||
      settings.automation?.githubToken ||
      ""
    ).trim();

    const githubRepo = (
      settings.automation?.githubRepo ||
      DEFAULT_GITHUB_REPO
    ).trim();

    if (!githubToken) {
      return NextResponse.json(
        {
          error:
            "GitHub PAT is not configured. Please set GITHUB_PAT in your Vercel Environment Variables or Admin Settings to dispatch cloud runs.",
        },
        { status: 400 }
      );
    }

    const runId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const run: PipelineRun = {
      id: runId,
      status: "queued",
      currentStage: "queued",
      startedAt: new Date().toISOString(),
      emailsProcessed: 0,
      newslettersIdentified: 0,
      articlesGenerated: 0,
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: "info",
          message: "🚀 Dispatched manual run to GitHub Actions cloud runner. Booting VM...",
        },
      ],
    };

    // Pre-create the run in Firestore so Admin UI immediately tracks it
    await createRun(run);

    // Dispatch to GitHub Actions
    const ghRes = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/pipeline.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Founders-North-Admin",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            trigger_source: "admin_manual_trigger",
            run_id: runId,
          },
        }),
      }
    );

    if (ghRes.status === 204) {
      return NextResponse.json({
        runId,
        status: "queued",
        runner: "github_actions",
        message: "✓ Dispatched pipeline run to GitHub Actions runner",
      });
    }

    const errorData = await ghRes.json().catch(() => ({}));
    return NextResponse.json(
      {
        error:
          errorData.message ||
          `GitHub dispatch failed with HTTP ${ghRes.status}. Check your GitHub PAT permissions (Actions: Read and write).`,
      },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to trigger pipeline",
      },
      { status: 500 }
    );
  }
}
