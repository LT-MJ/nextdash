import type { RuleResult, RuleStatus, SeoRule } from "@/types/seo";
import { getRuleMeta } from "./catalog";
import { registerSeoRule } from "./registry";
import {
  extractHeadings,
  extractImages,
  extractLinks,
  extractParagraphs,
  countWords,
  toPlainText,
} from "../content-parser";
import { containsKeyword, calculateKeywordDensity, keywordInFirstPortion } from "../keyword";

function define(key: string, evaluate: SeoRule["evaluate"]): void {
  const meta = getRuleMeta(key);
  if (!meta) throw new Error(`No catalog metadata registered for rule "${key}"`);
  registerSeoRule({
    key: meta.key,
    name: meta.name,
    category: meta.category,
    weight: meta.weight,
    contentTypes: meta.contentTypes,
    evaluate,
  });
}

function result(
  rule: string,
  category: RuleResult["category"],
  weight: number,
  status: RuleStatus,
  message: string,
  recommendation?: string
): RuleResult {
  const score = status === "PASS" ? weight : status === "WARNING" ? Math.round(weight * 0.5) : status === "INFO" ? weight : 0;
  return { rule, category, score, maxScore: weight, status, message, recommendation };
}

// ---------------------------------------------------------------------------
// CONTENT
// ---------------------------------------------------------------------------

define("contentHasTOC", (input) => {
  const headings = extractHeadings(input.contentHtml);
  const wordCount = countWords(toPlainText(input.contentHtml));
  const meta = getRuleMeta("contentHasTOC")!;
  if (wordCount < 800) {
    return result("contentHasTOC", meta.category, meta.weight, "NOT_APPLICABLE", "Content is short enough that a table of contents isn't necessary.");
  }
  const hasEnoughHeadings = headings.filter((h) => h.level === 2).length >= 3;
  return hasEnoughHeadings
    ? result("contentHasTOC", meta.category, meta.weight, "PASS", "Long-form content has enough H2 sections to support a table of contents.")
    : result(
        "contentHasTOC",
        meta.category,
        meta.weight,
        "INFO",
        "This is long-form content but has few sections.",
        "Consider adding a table of contents to help readers navigate long articles — this is a UX recommendation, not a ranking requirement."
      );
});

define("contentHasShortParagraphs", (input, ctx) => {
  const paragraphs = extractParagraphs(input.contentHtml);
  const meta = getRuleMeta("contentHasShortParagraphs")!;
  if (paragraphs.length === 0) {
    return result("contentHasShortParagraphs", meta.category, meta.weight, "NOT_APPLICABLE", "No paragraph markup found to analyze.");
  }
  const longParagraphs = paragraphs.filter((p) => countWords(p) > ctx.thresholds.paragraphMaxWords);
  const ratio = longParagraphs.length / paragraphs.length;
  if (ratio === 0) {
    return result("contentHasShortParagraphs", meta.category, meta.weight, "PASS", "Paragraphs are a scannable length.");
  }
  return result(
    "contentHasShortParagraphs",
    meta.category,
    meta.weight,
    ratio > 0.4 ? "FAIL" : "WARNING",
    `${longParagraphs.length} of ${paragraphs.length} paragraphs exceed ${ctx.thresholds.paragraphMaxWords} words.`,
    "Break up long paragraphs to improve readability and scannability."
  );
});

define("contentHasAssets", (input) => {
  const images = extractImages(input.contentHtml);
  const meta = getRuleMeta("contentHasAssets")!;
  return images.length > 0
    ? result("contentHasAssets", meta.category, meta.weight, "PASS", `Content includes ${images.length} image(s).`)
    : result(
        "contentHasAssets",
        meta.category,
        meta.weight,
        "INFO",
        "No images or media found in the content body.",
        "Supporting media (images, diagrams, video) can improve engagement and comprehension."
      );
});

define("lengthContent", (input, ctx) => {
  const wordCount = countWords(toPlainText(input.contentHtml));
  const meta = getRuleMeta("lengthContent")!;
  if (wordCount === 0) {
    return result("lengthContent", meta.category, meta.weight, "FAIL", "Content body is empty.", "Add content — empty pages provide no value to search engines or readers.");
  }
  if (wordCount < ctx.thresholds.thinContentWords) {
    return result(
      "lengthContent",
      meta.category,
      meta.weight,
      "WARNING",
      `Content is ${wordCount} words, below the ${ctx.thresholds.thinContentWords}-word thin-content threshold configured for this site.`,
      "This flags thin-content risk, not a required word count — some pages are legitimately short. Consider expanding if this page should rank for competitive terms."
    );
  }
  return result("lengthContent", meta.category, meta.weight, "PASS", `Content is ${wordCount} words.`);
});

define("hasContentAI", () => {
  const meta = getRuleMeta("hasContentAI")!;
  return result(
    "hasContentAI",
    meta.category,
    meta.weight,
    "INFO",
    "AI-content disclosure signals are not evaluated by this build. This is a reserved extension point — see docs/seo-architecture.md#ai-visibility.",
  );
});

// ---------------------------------------------------------------------------
// KEYWORDS
// ---------------------------------------------------------------------------

define("keywordNotUsed", (input) => {
  const meta = getRuleMeta("keywordNotUsed")!;
  return input.focusKeyword
    ? result("keywordNotUsed", meta.category, meta.weight, "PASS", `Focus keyword set: "${input.focusKeyword}".`)
    : result("keywordNotUsed", meta.category, meta.weight, "FAIL", "No focus keyword has been set.", "Set a focus keyword so the analyzer can evaluate keyword-relevance rules.");
});

define("keywordInTitle", (input) => {
  const meta = getRuleMeta("keywordInTitle")!;
  if (!input.focusKeyword) return result("keywordInTitle", meta.category, meta.weight, "NOT_APPLICABLE", "No focus keyword set.");
  const inTitle = containsKeyword(input.seoTitle, input.focusKeyword);
  return inTitle
    ? result("keywordInTitle", meta.category, meta.weight, "PASS", "Focus keyword appears in the SEO title.")
    : result("keywordInTitle", meta.category, meta.weight, "WARNING", "Focus keyword is missing from the SEO title.", `Consider naturally including "${input.focusKeyword}" in the title.`);
});

define("keywordInMetaDescription", (input) => {
  const meta = getRuleMeta("keywordInMetaDescription")!;
  if (!input.focusKeyword) return result("keywordInMetaDescription", meta.category, meta.weight, "NOT_APPLICABLE", "No focus keyword set.");
  const inDescription = containsKeyword(input.metaDescription, input.focusKeyword);
  return inDescription
    ? result("keywordInMetaDescription", meta.category, meta.weight, "PASS", "Focus keyword appears in the meta description.")
    : result("keywordInMetaDescription", meta.category, meta.weight, "WARNING", "Focus keyword is missing from the meta description.", `Mention "${input.focusKeyword}" naturally in the description to reinforce relevance to searchers.`);
});

define("keywordInPermalink", (input) => {
  const meta = getRuleMeta("keywordInPermalink")!;
  if (!input.focusKeyword) return result("keywordInPermalink", meta.category, meta.weight, "NOT_APPLICABLE", "No focus keyword set.");
  const inSlug = containsKeyword(input.slug.replace(/-/g, " "), input.focusKeyword);
  return inSlug
    ? result("keywordInPermalink", meta.category, meta.weight, "PASS", "Focus keyword appears in the URL.")
    : result("keywordInPermalink", meta.category, meta.weight, "WARNING", "Focus keyword is missing from the URL slug.", "Consider including the focus keyword in the URL — most impactful for new content, since changing an existing URL requires a redirect.");
});

define("keywordIn10Percent", (input) => {
  const meta = getRuleMeta("keywordIn10Percent")!;
  if (!input.focusKeyword) return result("keywordIn10Percent", meta.category, meta.weight, "NOT_APPLICABLE", "No focus keyword set.");
  const text = toPlainText(input.contentHtml);
  if (!text) return result("keywordIn10Percent", meta.category, meta.weight, "NOT_APPLICABLE", "No content body to analyze.");
  const found = keywordInFirstPortion(text, input.focusKeyword);
  return found
    ? result("keywordIn10Percent", meta.category, meta.weight, "PASS", "Focus keyword appears early in the content.")
    : result("keywordIn10Percent", meta.category, meta.weight, "WARNING", "Focus keyword doesn't appear in the introduction.", "Mention the focus keyword within the opening paragraph so both readers and search engines see relevance immediately.");
});

define("keywordInContent", (input) => {
  const meta = getRuleMeta("keywordInContent")!;
  if (!input.focusKeyword) return result("keywordInContent", meta.category, meta.weight, "NOT_APPLICABLE", "No focus keyword set.");
  const text = toPlainText(input.contentHtml);
  const found = containsKeyword(text, input.focusKeyword);
  return found
    ? result("keywordInContent", meta.category, meta.weight, "PASS", "Focus keyword appears in the body content.")
    : result("keywordInContent", meta.category, meta.weight, "FAIL", "Focus keyword does not appear anywhere in the body content.", "Use the focus keyword naturally within the content body.");
});

define("keywordInSubheadings", (input) => {
  const meta = getRuleMeta("keywordInSubheadings")!;
  if (!input.focusKeyword) return result("keywordInSubheadings", meta.category, meta.weight, "NOT_APPLICABLE", "No focus keyword set.");
  const headings = extractHeadings(input.contentHtml).filter((h) => h.level >= 2);
  if (headings.length === 0) return result("keywordInSubheadings", meta.category, meta.weight, "NOT_APPLICABLE", "No subheadings found.");
  const found = headings.some((h) => containsKeyword(h.text, input.focusKeyword));
  return found
    ? result("keywordInSubheadings", meta.category, meta.weight, "PASS", "Focus keyword appears in at least one subheading.")
    : result("keywordInSubheadings", meta.category, meta.weight, "WARNING", "Focus keyword is absent from all subheadings.", "Work the focus keyword (or a natural variation) into one subheading.");
});

define("keywordInImageAlt", (input) => {
  const meta = getRuleMeta("keywordInImageAlt")!;
  if (!input.focusKeyword) return result("keywordInImageAlt", meta.category, meta.weight, "NOT_APPLICABLE", "No focus keyword set.");
  const images = extractImages(input.contentHtml);
  if (images.length === 0) return result("keywordInImageAlt", meta.category, meta.weight, "NOT_APPLICABLE", "No images in this content.");
  const found = images.some((img) => containsKeyword(img.alt, input.focusKeyword));
  return found
    ? result("keywordInImageAlt", meta.category, meta.weight, "PASS", "At least one image ALT text reflects the focus keyword.")
    : result(
        "keywordInImageAlt",
        meta.category,
        meta.weight,
        "INFO",
        "No image ALT text mentions the focus keyword.",
        "Where contextually accurate, reflect the focus keyword in one image's ALT text — never force it into every image (that reads as keyword stuffing)."
      );
});

define("keywordDensity", (input, ctx) => {
  const meta = getRuleMeta("keywordDensity")!;
  if (!input.focusKeyword) return result("keywordDensity", meta.category, meta.weight, "NOT_APPLICABLE", "No focus keyword set.");
  const text = toPlainText(input.contentHtml);
  if (countWords(text) < 30) return result("keywordDensity", meta.category, meta.weight, "NOT_APPLICABLE", "Content is too short to measure density meaningfully.");
  const { occurrences, densityPercent } = calculateKeywordDensity(text, input.focusKeyword);
  if (occurrences === 0) {
    return result("keywordDensity", meta.category, meta.weight, "FAIL", "Focus keyword never appears in the content body.");
  }
  if (densityPercent > ctx.thresholds.keywordDensityMax) {
    return result(
      "keywordDensity",
      meta.category,
      meta.weight,
      "WARNING",
      `Keyword density is ${densityPercent.toFixed(1)}%, above the configured ${ctx.thresholds.keywordDensityMax}% ceiling.`,
      "This heuristic flags possible keyword stuffing, which can hurt readability. Density is not an official ranking formula — write for readers first."
    );
  }
  if (densityPercent < ctx.thresholds.keywordDensityMin) {
    return result(
      "keywordDensity",
      meta.category,
      meta.weight,
      "INFO",
      `Keyword density is ${densityPercent.toFixed(1)}%, below the configured ${ctx.thresholds.keywordDensityMin}% floor.`,
      "Low density isn't necessarily a problem — this is a heuristic signal, not an official ranking factor."
    );
  }
  return result("keywordDensity", meta.category, meta.weight, "PASS", `Keyword density is ${densityPercent.toFixed(1)}%, within the configured healthy range.`);
});

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

define("lengthPermalink", (input, ctx) => {
  const meta = getRuleMeta("lengthPermalink")!;
  const slug = input.slug || "";
  const issues: string[] = [];
  if (slug.length > ctx.thresholds.slugMaxLength) issues.push(`longer than ${ctx.thresholds.slugMaxLength} characters`);
  if (/[A-Z]/.test(slug)) issues.push("contains uppercase characters");
  if (/[^a-z0-9-]/.test(slug)) issues.push("contains special characters");
  if (/--/.test(slug)) issues.push("contains repeated hyphens");
  if (issues.length === 0) {
    return result("lengthPermalink", meta.category, meta.weight, "PASS", "URL slug is short and clean.");
  }
  return result("lengthPermalink", meta.category, meta.weight, "WARNING", `URL slug ${issues.join(", ")}.`, "Prefer short, lowercase, hyphenated slugs without special characters.");
});

// ---------------------------------------------------------------------------
// LINKS
// ---------------------------------------------------------------------------

define("linksHasInternal", (input, ctx) => {
  const meta = getRuleMeta("linksHasInternal")!;
  const links = extractLinks(input.contentHtml);
  const internalCount = links.filter((l) => l.internal).length;
  if (internalCount >= ctx.thresholds.minInternalLinks) {
    return result("linksHasInternal", meta.category, meta.weight, "PASS", `Content contains ${internalCount} internal link(s).`);
  }
  return result(
    "linksHasInternal",
    meta.category,
    meta.weight,
    internalCount === 0 ? "FAIL" : "WARNING",
    `Content contains only ${internalCount} internal link(s), below the configured minimum of ${ctx.thresholds.minInternalLinks}.`,
    "Add links to related content to strengthen site architecture and help this page avoid becoming orphaned."
  );
});

define("linksHasExternals", (input) => {
  const meta = getRuleMeta("linksHasExternals")!;
  const links = extractLinks(input.contentHtml);
  const externalCount = links.filter((l) => !l.internal).length;
  return externalCount > 0
    ? result("linksHasExternals", meta.category, meta.weight, "PASS", `Content links to ${externalCount} external source(s).`)
    : result("linksHasExternals", meta.category, meta.weight, "INFO", "No external links found.", "Linking to authoritative external sources can support credibility where relevant.");
});

define("linksNotAllExternals", (input) => {
  const meta = getRuleMeta("linksNotAllExternals")!;
  const links = extractLinks(input.contentHtml);
  if (links.length === 0) return result("linksNotAllExternals", meta.category, meta.weight, "NOT_APPLICABLE", "No links found.");
  const allExternal = links.every((l) => !l.internal);
  return allExternal
    ? result("linksNotAllExternals", meta.category, meta.weight, "WARNING", "Every link in this content points off-site.", "Balance external references with internal links to related content.")
    : result("linksNotAllExternals", meta.category, meta.weight, "PASS", "Content links both internally and externally.");
});

// ---------------------------------------------------------------------------
// TITLE & META
// ---------------------------------------------------------------------------

define("titleMissing", (input) => {
  const meta = getRuleMeta("titleMissing")!;
  return input.seoTitle && input.seoTitle.trim().length > 0
    ? result("titleMissing", meta.category, meta.weight, "PASS", "SEO title is set.")
    : result("titleMissing", meta.category, meta.weight, "FAIL", "SEO title is missing.", "Set a unique, descriptive SEO title.");
});

define("titleLength", (input, ctx) => {
  const meta = getRuleMeta("titleLength")!;
  if (!input.seoTitle) return result("titleLength", meta.category, meta.weight, "NOT_APPLICABLE", "No SEO title set.");
  const len = input.seoTitle.length;
  if (len < ctx.thresholds.titleMin) {
    return result("titleLength", meta.category, meta.weight, "WARNING", `Title is ${len} characters, shorter than the recommended ${ctx.thresholds.titleMin}.`, "Expand the title to use available search-result space.");
  }
  if (len > ctx.thresholds.titleMax) {
    return result("titleLength", meta.category, meta.weight, "WARNING", `Title is ${len} characters, longer than the recommended ${ctx.thresholds.titleMax}.`, "Shorten the title to reduce truncation risk in search results.");
  }
  return result("titleLength", meta.category, meta.weight, "PASS", `Title length (${len} characters) is within the recommended range.`);
});

define("titleStartWithKeyword", (input) => {
  const meta = getRuleMeta("titleStartWithKeyword")!;
  if (!input.focusKeyword || !input.seoTitle) return result("titleStartWithKeyword", meta.category, meta.weight, "NOT_APPLICABLE", "No focus keyword or title set.");
  const found = keywordInFirstPortion(input.seoTitle, input.focusKeyword, 0.5);
  return found
    ? result("titleStartWithKeyword", meta.category, meta.weight, "PASS", "Focus keyword appears near the beginning of the title.")
    : result("titleStartWithKeyword", meta.category, meta.weight, "INFO", "Focus keyword appears later in the title, or not at all.", "Titles that lead with the primary term are sometimes easier for searchers to scan — this is a minor heuristic, not a ranking requirement.");
});

const SENTIMENT_WORDS = ["best", "amazing", "essential", "ultimate", "proven", "powerful", "effective", "surprising"];
const POWER_WORDS = ["free", "new", "guide", "essential", "ultimate", "proven", "secret", "easy", "instant", "exclusive"];

define("titleSentiment", (input) => {
  const meta = getRuleMeta("titleSentiment")!;
  if (!input.seoTitle) return result("titleSentiment", meta.category, meta.weight, "NOT_APPLICABLE", "No SEO title set.");
  const hasSentiment = SENTIMENT_WORDS.some((w) => input.seoTitle!.toLowerCase().includes(w));
  return result(
    "titleSentiment",
    meta.category,
    meta.weight,
    "INFO",
    hasSentiment ? "Title carries a positive/emphatic tone." : "Title reads neutrally.",
    "Informational only — sentiment is not a confirmed ranking factor."
  );
});

define("titleHasPowerWords", (input) => {
  const meta = getRuleMeta("titleHasPowerWords")!;
  if (!input.seoTitle) return result("titleHasPowerWords", meta.category, meta.weight, "NOT_APPLICABLE", "No SEO title set.");
  const found = POWER_WORDS.some((w) => input.seoTitle!.toLowerCase().includes(w));
  return result(
    "titleHasPowerWords",
    meta.category,
    meta.weight,
    "INFO",
    found ? "Title includes an engaging/actionable word." : "Title doesn't include a common engagement word.",
    "Informational only — a title's clarity and accuracy matter far more than any single word choice."
  );
});

define("titleHasNumber", (input) => {
  const meta = getRuleMeta("titleHasNumber")!;
  if (!input.seoTitle) return result("titleHasNumber", meta.category, meta.weight, "NOT_APPLICABLE", "No SEO title set.");
  const found = /\d/.test(input.seoTitle);
  return result(
    "titleHasNumber",
    meta.category,
    meta.weight,
    "INFO",
    found ? "Title includes a number." : "Title doesn't include a number.",
    "Informational only — numbers (e.g. list length, year) can help set expectations but are not a ranking requirement."
  );
});

define("descriptionMissing", (input) => {
  const meta = getRuleMeta("descriptionMissing")!;
  return input.metaDescription && input.metaDescription.trim().length > 0
    ? result("descriptionMissing", meta.category, meta.weight, "PASS", "Meta description is set.")
    : result("descriptionMissing", meta.category, meta.weight, "FAIL", "Meta description is missing.", "Write a compelling meta description — search engines may otherwise auto-generate one from page content.");
});

define("descriptionLength", (input, ctx) => {
  const meta = getRuleMeta("descriptionLength")!;
  if (!input.metaDescription) return result("descriptionLength", meta.category, meta.weight, "NOT_APPLICABLE", "No meta description set.");
  const len = input.metaDescription.length;
  if (len < ctx.thresholds.descriptionMin) {
    return result("descriptionLength", meta.category, meta.weight, "WARNING", `Description is ${len} characters, shorter than the recommended ${ctx.thresholds.descriptionMin}.`, "Expand the description to better summarize the page and invite clicks.");
  }
  if (len > ctx.thresholds.descriptionMax) {
    return result("descriptionLength", meta.category, meta.weight, "WARNING", `Description is ${len} characters, longer than the recommended ${ctx.thresholds.descriptionMax}.`, "Shorten to reduce truncation risk in search results.");
  }
  return result("descriptionLength", meta.category, meta.weight, "PASS", `Description length (${len} characters) is within the recommended range.`);
});

// ---------------------------------------------------------------------------
// TECHNICAL
// ---------------------------------------------------------------------------

define("canonicalPresent", (input) => {
  const meta = getRuleMeta("canonicalPresent")!;
  return input.canonicalUrl
    ? result("canonicalPresent", meta.category, meta.weight, "PASS", "A canonical URL resolves for this content.")
    : result("canonicalPresent", meta.category, meta.weight, "WARNING", "No canonical URL could be resolved.", "Ensure this content type has a working canonical URL, or set one manually.");
});

define("robotsIndexable", (input) => {
  const meta = getRuleMeta("robotsIndexable")!;
  return input.robotsIndex
    ? result("robotsIndexable", meta.category, meta.weight, "PASS", "Page is set to index.")
    : result("robotsIndexable", meta.category, meta.weight, "WARNING", "Page is set to noindex.", "Confirm this is intentional — noindex prevents this page from appearing in search results at all.");
});

define("schemaPresent", (input) => {
  const meta = getRuleMeta("schemaPresent")!;
  return input.schemaType || input.hasCustomSchema
    ? result("schemaPresent", meta.category, meta.weight, "PASS", `Structured data configured (${input.schemaType ?? "custom"}).`)
    : result("schemaPresent", meta.category, meta.weight, "WARNING", "No structured data (schema) configured for this content.", "Enable a schema type appropriate to this content — e.g. Article/BlogPosting, Product, or Service.");
});

define("h1Missing", (input) => {
  const meta = getRuleMeta("h1Missing")!;
  const h1s = extractHeadings(input.contentHtml).filter((h) => h.level === 1);
  if (h1s.length === 0) {
    return result("h1Missing", meta.category, meta.weight, "FAIL", "Content has no H1 heading.", "Add exactly one H1 heading that reflects the page's primary topic.");
  }
  return result("h1Missing", meta.category, meta.weight, "PASS", "Content has an H1 heading.");
});

define("h1Multiple", (input) => {
  const meta = getRuleMeta("h1Multiple")!;
  const h1s = extractHeadings(input.contentHtml).filter((h) => h.level === 1);
  if (h1s.length > 1) {
    return result("h1Multiple", meta.category, meta.weight, "WARNING", `Content has ${h1s.length} H1 headings.`, "Use a single H1 per page; use H2/H3 for subsections.");
  }
  return result("h1Multiple", meta.category, meta.weight, h1s.length === 1 ? "PASS" : "NOT_APPLICABLE", h1s.length === 1 ? "Exactly one H1 heading found." : "No H1 to evaluate.");
});

define("headingHierarchy", (input) => {
  const meta = getRuleMeta("headingHierarchy")!;
  const headings = extractHeadings(input.contentHtml);
  if (headings.length < 2) return result("headingHierarchy", meta.category, meta.weight, "NOT_APPLICABLE", "Not enough headings to evaluate hierarchy.");
  const skips: string[] = [];
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1].level;
    const curr = headings[i].level;
    if (curr > prev + 1) skips.push(`H${prev} → H${curr}`);
  }
  return skips.length === 0
    ? result("headingHierarchy", meta.category, meta.weight, "PASS", "Heading levels progress without skipping.")
    : result("headingHierarchy", meta.category, meta.weight, "WARNING", `Heading levels skip in ${skips.length} place(s): ${skips.join(", ")}.`, "Use sequential heading levels (don't jump from H1 straight to H3).");
});

// ---------------------------------------------------------------------------
// IMAGES
// ---------------------------------------------------------------------------

define("imageAltMissing", (input) => {
  const meta = getRuleMeta("imageAltMissing")!;
  const images = extractImages(input.contentHtml);
  if (images.length === 0) return result("imageAltMissing", meta.category, meta.weight, "NOT_APPLICABLE", "No images in this content.");
  const missing = images.filter((img) => !img.alt || img.alt.trim().length === 0);
  if (missing.length === 0) {
    return result("imageAltMissing", meta.category, meta.weight, "PASS", `All ${images.length} image(s) have ALT text.`);
  }
  return result(
    "imageAltMissing",
    meta.category,
    meta.weight,
    missing.length === images.length ? "FAIL" : "WARNING",
    `${missing.length} of ${images.length} image(s) are missing ALT text.`,
    "Add descriptive ALT text to every content image for accessibility and image search discoverability."
  );
});

export function ensureBuiltinRulesLoaded(): void {
  // Importing this module is enough to run the `define(...)` calls above.
}
