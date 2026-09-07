export type ContentTypeKey =
  | "page"
  | "post"
  | "product"
  | "category"
  | "product_category"
  | "collection"
  | "author"
  | "homepage";

export type RuleStatus = "PASS" | "WARNING" | "FAIL" | "INFO" | "NOT_APPLICABLE";
export type RuleSeverity = "PASS" | "WARNING" | "FAIL" | "INFO";
export type SeoCategory = "CONTENT" | "KEYWORDS" | "LINKS" | "TITLE_META" | "TECHNICAL" | "IMAGES" | "URL";
export type SeoGrade = "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "CRITICAL";

export interface HeadingNode {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface ImageNode {
  src: string;
  alt: string | null;
}

export interface LinkNode {
  href: string;
  text: string;
  internal: boolean;
}

/** Normalized representation of one piece of content, ready for rule evaluation. */
export interface SeoAnalysisInput {
  entityType: ContentTypeKey;
  entityId: string;
  url: string;
  slug: string;
  seoTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  additionalKeywords: string[];
  contentHtml: string;
  robotsIndex: boolean;
  canonicalUrl: string | null;
  schemaType: string | null;
  hasCustomSchema: boolean;
  sitemapInclude: boolean;
  internalLinkCountIncoming?: number;
}

export interface RuleResult {
  rule: string;
  category: SeoCategory;
  score: number;
  maxScore: number;
  status: RuleStatus;
  message: string;
  recommendation?: string;
}

export interface SeoRule {
  key: string;
  name: string;
  category: SeoCategory;
  weight: number;
  contentTypes?: ContentTypeKey[];
  evaluate(input: SeoAnalysisInput, ctx: RuleContext): RuleResult;
}

export interface RuleContext {
  thresholds: SeoThresholds;
}

export interface SeoThresholds {
  titleMin: number;
  titleMax: number;
  descriptionMin: number;
  descriptionMax: number;
  paragraphMaxWords: number;
  keywordDensityMin: number;
  keywordDensityMax: number;
  thinContentWords: number;
  minInternalLinks: number;
  slugMaxLength: number;
}

export const DEFAULT_THRESHOLDS: SeoThresholds = {
  titleMin: 30,
  titleMax: 60,
  descriptionMin: 70,
  descriptionMax: 160,
  paragraphMaxWords: 120,
  keywordDensityMin: 0.5,
  keywordDensityMax: 2.5,
  thinContentWords: 300,
  minInternalLinks: 2,
  slugMaxLength: 75,
};

export interface SeoAnalysisResult {
  score: number;
  grade: SeoGrade;
  results: RuleResult[];
  categorySummary: Record<SeoCategory, { score: number; maxScore: number }>;
}

/** Normalized, fully-resolved SEO data ready to feed Next.js metadata + JSON-LD. */
export interface ResolvedSeo {
  title: string;
  description: string | null;
  canonicalUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  robotsDirectives: string;
  ogTitle: string;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string | null;
  twitterImage: string | null;
  schemaType: string | null;
}
