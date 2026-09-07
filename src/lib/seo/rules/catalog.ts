import type { ContentTypeKey, RuleSeverity, SeoCategory } from "@/types/seo";

export interface SeoRuleMeta {
  key: string;
  name: string;
  category: SeoCategory;
  weight: number;
  defaultSeverity: RuleSeverity;
  contentTypes?: ContentTypeKey[];
}

const STRUCTURED_CONTENT_TYPES: ContentTypeKey[] = ["post", "page"];

/**
 * Stable rule identifiers (do not rename — dashboards, exports, and the
 * bulk editor key off these). New rules should be added, not have existing
 * keys repurposed. See docs/seo-architecture.md#rule-registration.
 */
export const DEFAULT_SEO_RULES: SeoRuleMeta[] = [
  // CONTENT
  { key: "contentHasTOC", name: "Table of contents for long-form content", category: "CONTENT", weight: 2, defaultSeverity: "INFO", contentTypes: STRUCTURED_CONTENT_TYPES },
  { key: "contentHasShortParagraphs", name: "Paragraphs are scannable", category: "CONTENT", weight: 3, defaultSeverity: "WARNING", contentTypes: STRUCTURED_CONTENT_TYPES },
  { key: "contentHasAssets", name: "Content includes supporting media", category: "CONTENT", weight: 2, defaultSeverity: "INFO", contentTypes: STRUCTURED_CONTENT_TYPES },
  { key: "lengthContent", name: "Content depth vs. thin-content risk", category: "CONTENT", weight: 5, defaultSeverity: "WARNING" },
  { key: "hasContentAI", name: "AI-assisted content disclosure (informational)", category: "CONTENT", weight: 0, defaultSeverity: "INFO" },

  // KEYWORDS
  { key: "keywordNotUsed", name: "Focus keyword is set", category: "KEYWORDS", weight: 5, defaultSeverity: "FAIL" },
  { key: "keywordInTitle", name: "Focus keyword in SEO title", category: "KEYWORDS", weight: 5, defaultSeverity: "WARNING" },
  { key: "keywordInMetaDescription", name: "Focus keyword in meta description", category: "KEYWORDS", weight: 4, defaultSeverity: "WARNING" },
  { key: "keywordInPermalink", name: "Focus keyword in URL", category: "KEYWORDS", weight: 4, defaultSeverity: "WARNING" },
  { key: "keywordIn10Percent", name: "Focus keyword near the beginning of content", category: "KEYWORDS", weight: 4, defaultSeverity: "WARNING", contentTypes: STRUCTURED_CONTENT_TYPES },
  { key: "keywordInContent", name: "Focus keyword present in body content", category: "KEYWORDS", weight: 4, defaultSeverity: "WARNING" },
  { key: "keywordInSubheadings", name: "Focus keyword in subheadings", category: "KEYWORDS", weight: 4, defaultSeverity: "WARNING", contentTypes: STRUCTURED_CONTENT_TYPES },
  { key: "keywordInImageAlt", name: "Focus keyword reflected in image ALT text", category: "KEYWORDS", weight: 3, defaultSeverity: "INFO" },
  { key: "keywordDensity", name: "Keyword density within a healthy range", category: "KEYWORDS", weight: 3, defaultSeverity: "WARNING" },

  // URL
  { key: "lengthPermalink", name: "URL is short and readable", category: "URL", weight: 2, defaultSeverity: "INFO" },

  // LINKS
  { key: "linksHasInternal", name: "Contains internal links", category: "LINKS", weight: 4, defaultSeverity: "WARNING", contentTypes: STRUCTURED_CONTENT_TYPES },
  { key: "linksHasExternals", name: "Contains supporting external links", category: "LINKS", weight: 2, defaultSeverity: "INFO", contentTypes: STRUCTURED_CONTENT_TYPES },
  { key: "linksNotAllExternals", name: "Not exclusively external links", category: "LINKS", weight: 2, defaultSeverity: "WARNING", contentTypes: STRUCTURED_CONTENT_TYPES },

  // TITLE & META
  { key: "titleMissing", name: "SEO title is set", category: "TITLE_META", weight: 5, defaultSeverity: "FAIL" },
  { key: "titleLength", name: "SEO title length is search-friendly", category: "TITLE_META", weight: 3, defaultSeverity: "WARNING" },
  { key: "titleStartWithKeyword", name: "Focus keyword appears near the start of the title", category: "TITLE_META", weight: 3, defaultSeverity: "INFO" },
  { key: "titleSentiment", name: "Title sentiment (informational)", category: "TITLE_META", weight: 1, defaultSeverity: "INFO" },
  { key: "titleHasPowerWords", name: "Title uses engaging language (informational)", category: "TITLE_META", weight: 1, defaultSeverity: "INFO" },
  { key: "titleHasNumber", name: "Title includes a number (informational)", category: "TITLE_META", weight: 1, defaultSeverity: "INFO" },
  { key: "descriptionMissing", name: "Meta description is set", category: "TITLE_META", weight: 5, defaultSeverity: "FAIL" },
  { key: "descriptionLength", name: "Meta description length is search-friendly", category: "TITLE_META", weight: 3, defaultSeverity: "WARNING" },

  // TECHNICAL
  { key: "canonicalPresent", name: "Canonical URL resolves", category: "TECHNICAL", weight: 3, defaultSeverity: "WARNING" },
  { key: "robotsIndexable", name: "Page is indexable (not accidentally noindex)", category: "TECHNICAL", weight: 4, defaultSeverity: "WARNING" },
  { key: "schemaPresent", name: "Structured data (schema) is present", category: "TECHNICAL", weight: 3, defaultSeverity: "WARNING" },
  { key: "h1Missing", name: "Content has exactly one H1", category: "TECHNICAL", weight: 4, defaultSeverity: "FAIL", contentTypes: STRUCTURED_CONTENT_TYPES },
  { key: "h1Multiple", name: "No duplicate H1 elements", category: "TECHNICAL", weight: 3, defaultSeverity: "WARNING", contentTypes: STRUCTURED_CONTENT_TYPES },
  { key: "headingHierarchy", name: "Heading levels do not skip (e.g. H1 → H3)", category: "TECHNICAL", weight: 2, defaultSeverity: "WARNING", contentTypes: STRUCTURED_CONTENT_TYPES },

  // IMAGES
  { key: "imageAltMissing", name: "Images have ALT text", category: "IMAGES", weight: 3, defaultSeverity: "WARNING" },
];

export function getRuleMeta(key: string): SeoRuleMeta | undefined {
  return DEFAULT_SEO_RULES.find((rule) => rule.key === key);
}
