import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RuleResult, SeoGrade } from "@/types/seo";

const GRADE_STYLES: Record<SeoGrade, { ring: string; text: string; label: string }> = {
  EXCELLENT: { ring: "stroke-success", text: "text-success", label: "Excellent" },
  GOOD: { ring: "stroke-primary", text: "text-primary", label: "Good" },
  NEEDS_IMPROVEMENT: { ring: "stroke-warning", text: "text-warning", label: "Needs Improvement" },
  CRITICAL: { ring: "stroke-destructive", text: "text-destructive", label: "Critical" },
};

export function SeoScoreRing({ score, grade, size = 96 }: { score: number | null; grade: SeoGrade | null; size?: number }) {
  if (score === null || grade === null) {
    return (
      <div className="flex flex-col items-center gap-1" style={{ width: size }}>
        <HelpCircle className="h-10 w-10 text-muted-foreground" aria-hidden />
        <span className="text-xs font-medium text-muted-foreground">Not Analyzed</span>
      </div>
    );
  }

  const styles = GRADE_STYLES[grade];
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: size }} role="img" aria-label={`SEO score ${score} out of 100, ${styles.label}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} className="fill-none stroke-muted" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={cn("fill-none transition-all duration-500", styles.ring)}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-2xl font-bold", styles.text)}>{score}</span>
        </div>
      </div>
      <span className={cn("text-xs font-semibold", styles.text)}>{styles.label}</span>
    </div>
  );
}

export function SeoScoreBadge({ score, grade }: { score: number | null; grade: SeoGrade | null }) {
  if (score === null || grade === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <HelpCircle className="h-3 w-3" aria-hidden /> Not analyzed
      </span>
    );
  }
  const styles = GRADE_STYLES[grade];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium", styles.text)}>
      {score} · {styles.label}
    </span>
  );
}

const STATUS_ICON: Record<RuleResult["status"], typeof CheckCircle2> = {
  PASS: CheckCircle2,
  WARNING: AlertTriangle,
  FAIL: XCircle,
  INFO: Info,
  NOT_APPLICABLE: HelpCircle,
};

const STATUS_STYLE: Record<RuleResult["status"], string> = {
  PASS: "text-success",
  WARNING: "text-warning",
  FAIL: "text-destructive",
  INFO: "text-primary",
  NOT_APPLICABLE: "text-muted-foreground",
};

export function SeoRuleResultRow({ result }: { result: RuleResult }) {
  const Icon = STATUS_ICON[result.status];
  return (
    <li className="flex gap-3 border-b border-border py-3 last:border-0">
      <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", STATUS_STYLE[result.status])} aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {result.message}
          <span className={cn("ml-2 text-xs font-normal uppercase tracking-wide", STATUS_STYLE[result.status])}>{result.status.replace("_", " ")}</span>
        </p>
        {result.recommendation ? <p className="mt-0.5 text-sm text-muted-foreground">{result.recommendation}</p> : null}
      </div>
    </li>
  );
}
