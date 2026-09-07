import { db } from "@/lib/server/db";

/**
 * Wraps a maintenance task in a BackgroundJob row so it shows up in
 * /admin/jobs (spec §180/§181), whether it was triggered by the cron
 * endpoint or manually. Never run long audits inline inside a normal page
 * request (§56/§86) — this is the pattern scheduled work should use instead.
 */
export async function runBackgroundJob<T>(type: string, initiatedBy: string | null, task: () => Promise<T>): Promise<T> {
  const job = await db.backgroundJob.create({ data: { type, status: "RUNNING", startedAt: new Date(), initiatedBy: initiatedBy ?? undefined } });
  try {
    const result = await task();
    await db.backgroundJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", finishedAt: new Date(), result: JSON.stringify(result) },
    });
    return result;
  } catch (error) {
    await db.backgroundJob.update({
      where: { id: job.id },
      data: { status: "FAILED", finishedAt: new Date(), errorMessage: error instanceof Error ? error.message : "Unknown error" },
    });
    throw error;
  }
}
