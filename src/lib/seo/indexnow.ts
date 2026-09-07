import { db } from "@/lib/server/db";
import { getGlobalSeoSettings } from "./services/settings";

/**
 * IndexNow-compatible submission (spec §41). Submission does not guarantee
 * or expedite indexing — it only notifies participating search engines that
 * a URL changed. Requires INDEXNOW_KEY to be configured; a verification
 * file at /{INDEXNOW_KEY}.txt (served from the catch-all route) must also
 * be reachable for engines to trust the submission.
 */
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export function getIndexNowKey(): string | null {
  return process.env.INDEXNOW_KEY || null;
}

export async function enqueueIndexingUrls(urls: string[], action: "SUBMIT" | "UPDATE" | "REMOVE" = "SUBMIT") {
  return db.$transaction(
    urls.map((url) =>
      db.indexingQueueItem.create({
        data: { url, action, provider: "INDEXNOW", status: "PENDING" },
      })
    )
  );
}

export async function processIndexingQueue(limit = 50): Promise<{ submitted: number; failed: number }> {
  const key = getIndexNowKey();
  const pending = await db.indexingQueueItem.findMany({ where: { status: "PENDING" }, take: limit });
  if (pending.length === 0) return { submitted: 0, failed: 0 };

  if (!key) {
    await db.indexingQueueItem.updateMany({
      where: { id: { in: pending.map((p) => p.id) } },
      data: { status: "FAILED", response: "INDEXNOW_KEY is not configured.", processedAt: new Date() },
    });
    return { submitted: 0, failed: pending.length };
  }

  const globalSettings = await getGlobalSeoSettings();
  const host = new URL(globalSettings.siteUrl).host;

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${globalSettings.siteUrl.replace(/\/$/, "")}/${key}.txt`,
        urlList: pending.map((p) => p.url),
      }),
      signal: AbortSignal.timeout(10000),
    });

    const status = response.ok ? "SUCCESS" : "FAILED";
    await db.indexingQueueItem.updateMany({
      where: { id: { in: pending.map((p) => p.id) } },
      data: { status, response: `HTTP ${response.status}`, processedAt: new Date() },
    });
    return response.ok ? { submitted: pending.length, failed: 0 } : { submitted: 0, failed: pending.length };
  } catch (error) {
    await db.indexingQueueItem.updateMany({
      where: { id: { in: pending.map((p) => p.id) } },
      data: { status: "FAILED", response: error instanceof Error ? error.message : "Unknown error", processedAt: new Date() },
    });
    return { submitted: 0, failed: pending.length };
  }
}
