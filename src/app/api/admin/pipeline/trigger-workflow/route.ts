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
        {
          error:
            "GitHub PAT is not set. Add GITHUB_PAT to your environment variables or settings.",
        },
        { status: 400 }
      );
    }

    // Ping check: Query workflow status via GitHub API without running any pipeline or LLM calls
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
          error: `Workflow 'pipeline.yml' not found in repository ${githubRepo}. Make sure the code is pushed to GitHub.`,
        },
        { status: 404 }
      );
    }

    const errorData = await checkResponse.json().catch(() => ({}));
    return NextResponse.json(
      {
        error:
          errorData.message ||
          `GitHub API responded with HTTP ${checkResponse.status}: ${checkResponse.statusText}`,
      },
      { status: checkResponse.status || 500 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect to GitHub API",
      },
      { status: 500 }
    );
  }
}
