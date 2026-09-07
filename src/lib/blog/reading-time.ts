import { toPlainText, countWords } from "@/lib/seo/content-parser";

/**
 * Estimates reading time for a blog post's HTML body at ~200 words/minute,
 * rounded to the nearest minute with a floor of 1 (spec: reading-time calc).
 */
export function calculateReadingTime(html: string): number {
  const words = countWords(toPlainText(html ?? ""));
  return Math.max(1, Math.round(words / 200));
}
