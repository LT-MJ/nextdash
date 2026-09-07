/**
 * Focus-keyword heuristics. These are intentionally simple: exact-phrase and
 * light normalization (case, punctuation, basic plural) matching. They are
 * heuristics that flag likely relevance signals, not an official ranking
 * calculation — see docs/seo-architecture.md "Heuristic vs. ranking factor".
 */

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularVariants(word: string): string[] {
  const variants = new Set([word]);
  if (word.endsWith("ies")) variants.add(word.slice(0, -3) + "y");
  else if (word.endsWith("es")) variants.add(word.slice(0, -2));
  else if (word.endsWith("s")) variants.add(word.slice(0, -1));
  else {
    variants.add(word + "s");
    variants.add(word + "es");
  }
  return [...variants];
}

/** Returns true if the normalized keyword phrase (or a simple plural variant) appears in the text. */
export function containsKeyword(text: string | null | undefined, keyword: string | null | undefined): boolean {
  if (!text || !keyword) return false;
  const normalizedText = ` ${normalize(text)} `;
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return false;

  if (normalizedText.includes(` ${normalizedKeyword} `) || normalizedText.includes(normalizedKeyword)) {
    return true;
  }

  const words = normalizedKeyword.split(" ");
  if (words.length === 1) {
    return singularVariants(words[0]).some((variant) => normalizedText.includes(` ${variant} `));
  }
  return false;
}

/** Occurrences of the exact normalized phrase in text. */
export function countOccurrences(text: string, keyword: string): number {
  const normalizedText = normalize(text);
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return 0;
  let count = 0;
  let idx = normalizedText.indexOf(normalizedKeyword);
  while (idx !== -1) {
    count += 1;
    idx = normalizedText.indexOf(normalizedKeyword, idx + normalizedKeyword.length);
  }
  return count;
}

export interface KeywordDensityResult {
  occurrences: number;
  meaningfulWordCount: number;
  densityPercent: number;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be", "been",
  "to", "of", "in", "on", "for", "with", "as", "by", "at", "from", "this", "that",
  "it", "its", "we", "you", "your", "our", "their", "he", "she", "they",
]);

export function calculateKeywordDensity(text: string, keyword: string): KeywordDensityResult {
  const words = normalize(text).split(" ").filter(Boolean);
  const meaningfulWordCount = words.filter((w) => !STOP_WORDS.has(w)).length || words.length;
  const occurrences = countOccurrences(text, keyword);
  const keywordWordCount = normalize(keyword).split(" ").filter(Boolean).length || 1;
  const densityPercent = meaningfulWordCount > 0 ? ((occurrences * keywordWordCount) / meaningfulWordCount) * 100 : 0;
  return { occurrences, meaningfulWordCount, densityPercent };
}

/** True if the keyword appears within the first `percent` fraction of the text (e.g. 0.1 = first 10%). */
export function keywordInFirstPortion(text: string, keyword: string, percent = 0.1): boolean {
  const normalizedText = normalize(text);
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return false;
  const cutoff = Math.max(50, Math.floor(normalizedText.length * percent));
  return normalizedText.slice(0, cutoff).includes(normalizedKeyword);
}
