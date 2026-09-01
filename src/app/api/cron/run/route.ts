// ---------------------------------------------------------------------------
// Founders North - Automated Cron Trigger API
// ---------------------------------------------------------------------------
// Can be triggered by cron-job.org, Vercel Cron, or external schedulers
// Authorization: Bearer <CRON_SECRET> header or ?key=<CRON_SECRET> query param
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { getSettings, createRun } from "@/lib/db";
import { executePipeline } from "@/lib/pipeline/runner";
import type { PipelineRun } from "@/types";

const DEFAULT_GITHUB_REPO = "HarinManiK/founders-north";

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const { searchParams } = new URL(request.url);
  const keyParam = searchParams.get("key");

  // If CRON_SECRET is set in environment, require authorization
  if (cronSecret) {
    const isBearerValid = authHeader === `Bearer ${cronSecret}`;
    const isParamValid = keyParam === cronSecret;
    if (!isBearerValid && !isParamValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const settings = await getSettings();

    // Check if automation is enabled in Admin settings
    if (settings.automation && !settings.automation.enabled) {
      return NextResponse.json({
        message: "Automated runs are currently disabled in Admin Settings.",
        status: "disabled",
      });
    }

    const githubToken =
      process.env.GITHUB_PAT ||
      settings.automation?.githubToken ||
      "";
    const githubRepo =
      settings.automation?.githubRepo ||
      DEFAULT_GITHUB_REPO;

    // If GitHub Token is available, dispatch to GitHub Actions runner
    if (githubToken) {
      const ghRes = await fetch(
        `https://api.github.com/repos/${githubRepo}/actions/workflows/pipeline.yml/dispatches`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken.trim()}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Founders-North-Cron",
          },
          body: JSON.stringify({
            ref: "main",
            inputs: {
              trigger_source: "cron_scheduler",
            },
          }),
        }
      );

      if (ghRes.status === 204) {
        return NextResponse.json({
          message: "Dispatched pipeline run to GitHub Actions runner",
          runner: "github_actions",
          status: "triggered",
        });
      }
    }

    // Fallback: Run directly on serverless
    const runId = `cron-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const run: PipelineRun = {
      id: runId,
      status: "queued",
      currentStage: "queued",
      startedAt: new Date().toISOString(),
      emailsProcessed: 0,
      newslettersIdentified: 0,
      articlesGenerated: 0,
    };

    await createRun(run);

    executePipeline(runId).catch((err) => {
      console.error(`Automated cron run ${runId} failed:`, err);
    });

    return NextResponse.json({
      message: "Automated pipeline run initiated directly",
      runId,
      status: "queued",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initiate automated run",
      },
      { status: 500 }
    );
  }
}
