import { db } from "@/lib/server/db";

/**
 * Logs a 404 hit. No IP address is stored — only the requested path,
 * referrer, and user agent, which is enough for triage without holding
 * onto anything more identifying than a typical web server access log
 * (spec §29, data retention/privacy).
 */
export async function logNotFound(path: string, referrer: string | null, userAgent: string | null): Promise<void> {
  await db.notFoundLog.upsert({
    where: { url: path },
    update: { hitCount: { increment: 1 }, lastSeenAt: new Date() },
    create: { url: path, referrer, userAgent },
  });
}

export function renderNotFoundHtml(path: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Page not found</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0a0a0f; color: #f2f2f5; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; }
  main { text-align: center; padding: 2rem; }
  h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
  p { color: #9a9aa5; margin-bottom: 1.5rem; }
  code { background: #1a1a22; padding: 0.15rem 0.4rem; border-radius: 4px; }
  a { color: #8ab4f8; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
<main>
  <h1>404</h1>
  <p>We couldn&rsquo;t find <code>${escapeHtml(path)}</code>.</p>
  <a href="/">Return home</a>
</main>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
