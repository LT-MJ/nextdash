import "./rules/builtin";
import { getRegisteredRules } from "./rules/registry";
import type {
  ContentTypeKey,
  RuleContext,
  RuleResult,
  SeoAnalysisInput,
  SeoAnalysisResult,
  SeoCategory,
  SeoGrade,
  SeoThresholds,
} from "@/types/seo";
import { DEFAULT_THRESHOLDS } from "@/types/seo";

export interface RuleOverride {
  key: string;
  enabled: boolean;
  weight?: number;
}

const CATEGORIES: SeoCategory[] = ["CONTENT", "KEYWORDS", "LINKS", "TITLE_META", "TECHNICAL", "IMAGES", "URL"];

function gradeForScore(score: number): SeoGrade {
  if (score >= 85) return "EXCELLENT";
  if (score >= 65) return "GOOD";
  if (score >= 40) return "NEEDS_IMPROVEMENT";
  return "CRITICAL";
}

/**
 * Runs every applicable, enabled rule against the given content and produces
 * a 0-100 score. Only rules applicable to `input.entityType` and not
 * NOT_APPLICABLE for this specific content are counted toward the maximum,
 * so short/simple pages are not penalized for structural rules that don't
 * apply to them (spec §9, §11).
 */
export function analyzeSeo(
  input: SeoAnalysisInput,
  options: { overrides?: RuleOverride[]; thresholds?: Partial<SeoThresholds> } = {}
): SeoAnalysisResult {
  const thresholds: SeoThresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };
  const ctx: RuleContext = { thresholds };
  const overrideMap = new Map((options.overrides ?? []).map((o) => [o.key, o]));

  const applicableRules = getRegisteredRules().filter((rule) => {
    const override = overrideMap.get(rule.key);
    if (override && !override.enabled) return false;
    if (rule.contentTypes && !rule.contentTypes.includes(input.entityType as ContentTypeKey)) return false;
    return true;
  });

  const results: RuleResult[] = applicableRules.map((rule) => {
    const override = overrideMap.get(rule.key);
    const evaluated = rule.evaluate(input, ctx);
    if (override?.weight !== undefined && override.weight !== rule.weight) {
      const ratio = evaluated.maxScore > 0 ? evaluated.score / evaluated.maxScore : 0;
      return { ...evaluated, maxScore: override.weight, score: Math.round(ratio * override.weight) };
    }
    return evaluated;
  });

  const scored = results.filter((r) => r.status !== "NOT_APPLICABLE" && r.maxScore > 0);
  const totalScore = scored.reduce((sum, r) => sum + r.score, 0);
  const totalMax = scored.reduce((sum, r) => sum + r.maxScore, 0);
  const score = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const categorySummary = Object.fromEntries(
    CATEGORIES.map((category) => {
      const inCategory = scored.filter((r) => r.category === category);
      return [
        category,
        {
          score: inCategory.reduce((sum, r) => sum + r.score, 0),
          maxScore: inCategory.reduce((sum, r) => sum + r.maxScore, 0),
        },
      ];
    })
  ) as Record<SeoCategory, { score: number; maxScore: number }>;

  return { score, grade: gradeForScore(score), results, categorySummary };
}
