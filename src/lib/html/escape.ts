/**
 * Shared HTML escaping used by every hand-built HTML string in the app —
 * src/lib/seo/services/page-renderer.ts, src/lib/pages/blocks/render.ts, and
 * src/lib/site/chrome-render.ts — so there's exactly one escaping
 * implementation for the string-based rendering path (the Route Handler
 * that serves CMS Pages can't render React, see docs/pages.md).
 */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
