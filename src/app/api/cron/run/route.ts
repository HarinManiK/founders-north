// ---------------------------------------------------------------------------
// Founders North - Automated Cron Trigger API
// ---------------------------------------------------------------------------
// Triggered by cron-job.org every 1 minute
// Checks Firestore automation settings, checks IST time, and fires GitHub runner
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";

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
  const isForce = searchParams.get("force") === "true";

  // If CRON_SECRET is set in environment, require authorization
  if (cronSecret && !isForce) {
    const isBearerValid = authHeader === `Bearer ${cronSecret}`;
    const isParamValid = keyParam === cronSecret;
    if (!isBearerValid && !isParamValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const settings = await getSettings();
    const automation = settings.automation;

    // 1. Check if automation is enabled in Admin settings
    if (!automation || !automation.enabled) {
      return NextResponse.json({
        message: "Automated runs are currently disabled in Admin Settings.",
        status: "disabled",
      });
    }

    // 2. Check scheduled time in Asia/Kolkata (IST) unless forced
    if (!isForce) {
      const istDateStr = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const nowIST = new Date(istDateStr);
      const currentHours = nowIST.getHours();
      const currentMinutes = nowIST.getMinutes();
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;

      const [schedHours, schedMins] = (automation.time || "07:30")
        .split(":")
        .map(Number);
      const schedTimeInMinutes = schedHours * 60 + schedMins;

      // If before scheduled time today, return waiting
      if (currentTimeInMinutes < schedTimeInMinutes) {
        return NextResponse.json({
          message: `Waiting for scheduled time (${automation.time || "07:30"} IST). Current time is ${String(currentHours).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")} IST.`,
          status: "waiting",
          currentTime: `${String(currentHours).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")}`,
          scheduledTime: automation.time || "07:30",
        });
      }

      // If at or after scheduled time, verify if it already executed today after the scheduled time
      if (automation.lastRunAt) {
        const lastRunIST = new Date(
          new Date(automation.lastRunAt).toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
          })
        );
        const isSameDay =
          lastRunIST.getFullYear() === nowIST.getFullYear() &&
          lastRunIST.getMonth() === nowIST.getMonth() &&
          lastRunIST.getDate() === nowIST.getDate();

        if (isSameDay) {
          const lastRunMinutes =
            lastRunIST.getHours() * 60 + lastRunIST.getMinutes();
          if (lastRunMinutes >= schedTimeInMinutes) {
            return NextResponse.json({
              message: `Daily scheduled pipeline already ran today at ${automation.lastRunAt}. Skipping duplicate ping.`,
              status: "already_ran",
            });
          }
        }
      }
    }

    const githubToken = (
      process.env.GITHUB_PAT ||
      automation?.githubToken ||
      ""
    ).trim();

    const githubRepo = (
      automation?.githubRepo ||
      DEFAULT_GITHUB_REPO
    ).trim();

    if (!githubToken) {
      return NextResponse.json(
        {
          error:
            "GitHub PAT is not set. Add GITHUB_PAT to your Vercel environment variables.",
          status: "missing_token",
        },
        { status: 500 }
      );
    }

    // Update lastRunAt timestamp immediately to prevent race conditions
    await saveSettings({
      automation: {
        ...automation,
        lastRunAt: new Date().toISOString(),
      },
    });

    // 3. Dispatch to GitHub Actions runner
    const ghRes = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/pipeline.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Founders-North-Cron",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            trigger_source: "cron_job_org",
          },
        }),
      }
    );

    if (ghRes.status === 204) {
      return NextResponse.json({
        success: true,
        message: "✓ Dispatched pipeline run to GitHub Actions runner",
        runner: "github_actions",
        status: "triggered",
      });
    }

    const errorData = await ghRes.json().catch(() => ({}));
    return NextResponse.json(
      {
        error: errorData.message || `GitHub dispatch returned ${ghRes.status}`,
        status: "dispatch_failed",
      },
      { status: 500 }
    );
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
