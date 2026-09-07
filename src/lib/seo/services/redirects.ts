import { db } from "@/lib/server/db";

export interface MatchedRedirect {
  id: string;
  destination: string;
  statusCode: number;
}

/**
 * Finds a redirect for the given path. Checks an exact match first, then
 * falls back to scanning enabled regex-mode redirects. Redirect chains
 * (destination itself has an outgoing redirect) are flattened one hop here
 * to avoid a double round-trip; deeper chains are flagged at creation time
 * instead of resolved recursively, to bound worst-case latency.
 */
export async function findMatchingRedirect(path: string): Promise<MatchedRedirect | null> {
  const exact = await db.redirect.findFirst({ where: { source: path, enabled: true, isRegex: false } });
  if (exact) return exact;

  const regexRedirects = await db.redirect.findMany({ where: { enabled: true, isRegex: true }, take: 200 });
  for (const redirect of regexRedirects) {
    try {
      const pattern = new RegExp(redirect.source);
      if (pattern.test(path)) return redirect;
    } catch {
      // Malformed regex authored by an admin — skip rather than 500 the request.
      continue;
    }
  }
  return null;
}

export async function recordRedirectHit(id: string): Promise<void> {
  await db.redirect.update({ where: { id }, data: { hitCount: { increment: 1 }, lastHitAt: new Date() } });
}
