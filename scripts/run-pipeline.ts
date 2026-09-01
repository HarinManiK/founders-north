// ---------------------------------------------------------------------------
// Founders North - Autonomous Scheduled Pipeline Runner (GitHub Actions)
// ---------------------------------------------------------------------------

import { getSettings, saveSettings, createRun } from "../src/lib/db";
import { executePipeline } from "../src/lib/pipeline/runner";
import type { PipelineRun } from "../src/types";

async function main() {
  const isForce =
    process.argv.includes("--force") ||
    process.env.GITHUB_EVENT_NAME === "workflow_dispatch";

  console.log("=================================================================");
  console.log("   FOUNDERS NORTH - AUTOMATED PIPELINE RUNNER");
  console.log("   Execution Mode:", isForce ? "FORCED / MANUAL" : "SCHEDULED CHECK");
  console.log("   Server UTC Time:", new Date().toISOString());
  console.log("=================================================================");

  const settings = await getSettings();
  const automation = settings.automation;

  if (!isForce) {
    if (!automation || !automation.enabled) {
      console.log("[SKIP] Automation is disabled in Admin Settings. Exiting.");
      process.exit(0);
    }

    // Get current time in Asia/Kolkata (IST)
    const istDateStr = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    const nowIST = new Date(istDateStr);
    const nowHours = nowIST.getHours();
    const nowMinutes = nowIST.getMinutes();
    const currentTimeInMinutes = nowHours * 60 + nowMinutes;

    const [schedHours, schedMinutes] = (automation.time || "07:30")
      .split(":")
      .map(Number);
    const schedTimeInMinutes = schedHours * 60 + schedMinutes;

    console.log(
      `[TIME CHECK] Current IST: ${String(nowHours).padStart(2, "0")}:${String(
        nowMinutes
      ).padStart(2, "0")} (${currentTimeInMinutes}m)`
    );
    console.log(
      `[TIME CHECK] Scheduled IST: ${automation.time} (${schedTimeInMinutes}m)`
    );

    // Difference in minutes
    const diff = currentTimeInMinutes - schedTimeInMinutes;

    // Window: between 0 and 20 minutes after scheduled time
    const isInsideWindow = diff >= 0 && diff <= 20;

    if (!isInsideWindow) {
      console.log(
        `[SKIP] Outside trigger window (diff: ${diff}m). Will check again on next cycle.`
      );
      process.exit(0);
    }

    // Check if we already ran today for this schedule
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
        console.log(
          `[SKIP] Already executed successfully today at ${automation.lastRunAt}.`
        );
        process.exit(0);
      }
    }
  }

  // Execute the pipeline
  const runId = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const run: PipelineRun = {
    id: runId,
    status: "queued",
    currentStage: "queued",
    startedAt: new Date().toISOString(),
    emailsProcessed: 0,
    newslettersIdentified: 0,
    articlesGenerated: 0,
  };

  console.log(`[INIT] Creating run record in Firestore: ${runId}`);
  await createRun(run);

  // Update lastRunAt in settings
  await saveSettings({
    automation: {
      ...(automation || {
        enabled: true,
        time: "07:30",
        timezone: "Asia/Kolkata",
      }),
      lastRunAt: new Date().toISOString(),
    },
  });

  console.log(`[EXEC] Starting full pipeline execution...`);
  await executePipeline(runId);

  console.log(`[DONE] Pipeline execution completed for run: ${runId}`);
}

main().catch((err) => {
  console.error(
    "FATAL: Automated pipeline run failed with unhandled error:",
    err
  );
  process.exit(1);
});
