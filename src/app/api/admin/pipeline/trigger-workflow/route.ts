import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

const DEFAULT_GITHUB_REPO = "HarinManiK/founders-north";

export async function POST(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const settings = await getSettings();

    const action = body.action || "verify"; // "verify" (ping check) or "dispatch" (run in cloud)

    const githubToken = (
      process.env.GITHUB_PAT ||
      body.githubToken ||
      settings.automation?.githubToken ||
      ""
    ).trim();

    const githubRepo = (
      body.githubRepo ||
      settings.automation?.githubRepo ||
      DEFAULT_GITHUB_REPO
    ).trim();

    if (!githubToken) {
      return NextResponse.json(
        {
          error:
            "GitHub PAT is not set. Add GITHUB_PAT to your Vercel environment variables.",
        },
        { status: 400 }
      );
    }

    // 1. Verification Mode: fast health check with GitHub API
    if (action === "verify") {
      const checkResponse = await fetch(
        `https://api.github.com/repos/${githubRepo}/actions/workflows/pipeline.yml`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Founders-North-Admin",
          },
        }
      );

      if (checkResponse.ok) {
        const data = await checkResponse.json();
        return NextResponse.json({
          success: true,
          message: `✓ Connected! GitHub Actions runner is active (${data.name || "pipeline.yml"}).`,
          repo: githubRepo,
          workflowState: data.state || "active",
        });
      }

      if (checkResponse.status === 401 || checkResponse.status === 403) {
        return NextResponse.json(
          {
            error:
              "GitHub token authorization failed. Please check token permissions (Actions: Read & write).",
          },
          { status: 403 }
        );
      }

      if (checkResponse.status === 404) {
        return NextResponse.json(
          {
            error: `Workflow 'pipeline.yml' not found in ${githubRepo}. Make sure latest code is pushed to GitHub.`,
          },
          { status: 404 }
        );
      }

      const errorData = await checkResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            errorData.message ||
            `GitHub API returned ${checkResponse.status}: ${checkResponse.statusText}`,
        },
        { status: checkResponse.status || 500 }
      );
    }

    // 2. Dispatch Mode: Actually trigger the runner execution in GitHub cloud
    const dispatchResponse = await fetch(
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
          },
        }),
      }
    );

    if (dispatchResponse.status === 204) {
      return NextResponse.json({
        success: true,
        message: "✓ Cloud runner started! Check the Runs tab to watch execution.",
        repo: githubRepo,
      });
    }

    const errorData = await dispatchResponse.json().catch(() => ({}));
    return NextResponse.json(
      {
        error:
          errorData.message ||
          `GitHub dispatch failed (${dispatchResponse.status}): ${dispatchResponse.statusText}`,
      },
      { status: dispatchResponse.status || 500 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to communicate with GitHub Actions",
      },
      { status: 500 }
    );
  }
}
