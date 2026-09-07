import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { processIndexingQueue } from "@/lib/seo/indexnow";
import { runBackgroundJob } from "@/lib/server/background-jobs";

/**
 * Scheduled maintenance entry point. Trigger this from an external
 * scheduler (Vercel Cron, GitHub Actions on a cron trigger, a self-hosted
 * cron job hitting this URL with `curl`) rather than from inside a normal
 * page request — see docs/scheduled-jobs.md.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`. Refuses to run
 * with no error leakage if CRON_SECRET isn't configured or doesn't match.
 */
const RETENTION_DAYS = {
  notFoundLog: 90,
  indexingQueue: 30,
  activityLog: 365,
  backgroundJob: 90,
};

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runBackgroundJob("scheduled_maintenance", null, async () => {
    const indexing = await processIndexingQueue(200);

    const cutoff = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [prunedNotFound, prunedIndexing, prunedActivity, prunedJobs] = await Promise.all([
      db.notFoundLog.deleteMany({ where: { resolved: true, lastSeenAt: { lt: cutoff(RETENTION_DAYS.notFoundLog) } } }),
      db.indexingQueueItem.deleteMany({ where: { status: { in: ["SUCCESS", "FAILED"] }, processedAt: { lt: cutoff(RETENTION_DAYS.indexingQueue) } } }),
      db.activityLog.deleteMany({ where: { createdAt: { lt: cutoff(RETENTION_DAYS.activityLog) } } }),
      db.backgroundJob.deleteMany({ where: { status: { in: ["COMPLETED", "FAILED"] }, finishedAt: { lt: cutoff(RETENTION_DAYS.backgroundJob) } } }),
    ]);

    return {
      indexing,
      pruned: {
        notFoundLog: prunedNotFound.count,
        indexingQueue: prunedIndexing.count,
        activityLog: prunedActivity.count,
        backgroundJob: prunedJobs.count,
      },
    };
  });

  return NextResponse.json({ success: true, result });
}
