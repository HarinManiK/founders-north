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
        { error: "GitHub PAT token is not configured in GITHUB_PAT environment variable or database." },
        { status: 400 }
      );
    }

    // Call GitHub Actions workflow dispatch API
    const response = await fetch(
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
            trigger_source: "admin_panel_test",
          },
        }),
      }
    );

    if (response.status === 204) {
      return NextResponse.json({
        success: true,
        message: "✓ Runner started successfully! Check the Runs tab.",
        repo: githubRepo,
      });
    }

    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json(
      {
        error:
          errorData.message ||
          `GitHub API returned ${response.status}: ${response.statusText}`,
      },
      { status: response.status || 500 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to trigger GitHub Action",
      },
      { status: 500 }
    );
  }
}
