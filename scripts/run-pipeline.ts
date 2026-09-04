// ---------------------------------------------------------------------------
// Founders North - Autonomous Pipeline Runner (GitHub Actions)
// ---------------------------------------------------------------------------

import { getSettings, saveSettings, createRun, getRun } from "../src/lib/db";
import { executePipeline } from "../src/lib/pipeline/runner";
import type { PipelineRun } from "../src/types";

async function main() {
  console.log("=================================================================");
  console.log("   FOUNDERS NORTH - AUTOMATED PIPELINE RUNNER");
  console.log("   Timestamp:", new Date().toISOString());
  console.log("=================================================================");

  const settings = await getSettings();
  const automation = settings.automation;

  const envRunId = (process.env.RUN_ID || "").trim();
  const runId = envRunId || `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const existingRun = await getRun(runId);
  if (!existingRun) {
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
  } else {
    console.log(`[INIT] Connected to existing run record in Firestore: ${runId}`);
  }

  // Only update lastRunAt for scheduled cron runs so manual tests don't suppress the daily schedule
  const isScheduled = process.env.TRIGGER_SOURCE === "cron_job_org";
  if (isScheduled) {
    await saveSettings({
      automation: {
        ...(automation || {
          enabled: true,
          time: "07:30",
          timezone: "America/New_York",
        }),
        lastRunAt: new Date().toISOString(),
      },
    });
  }

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
