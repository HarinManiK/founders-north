// ---------------------------------------------------------------------------
// Founders North - Autonomous Scheduled Pipeline Runner (GitHub Actions)
// ---------------------------------------------------------------------------

import { createRun } from "../src/lib/db";
import { executePipeline } from "../src/lib/pipeline/runner";
import type { PipelineRun } from "../src/types";

async function main() {
  console.log("=================================================================");
  console.log("   FOUNDERS NORTH - AUTOMATED PIPELINE RUNNER");
  console.log("   Timestamp:", new Date().toISOString());
  console.log("=================================================================");

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

  console.log(`[EXEC] Starting full pipeline execution...`);
  await executePipeline(runId);

  console.log(`[DONE] Pipeline execution completed for run: ${runId}`);
}

main().catch((err) => {
  console.error("FATAL: Automated pipeline run failed with unhandled error:", err);
  process.exit(1);
});
