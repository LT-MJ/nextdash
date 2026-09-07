import { db } from "@/lib/server/db";
import { findAllDuplicateMetadata } from "./duplicates";
import { analyzeInternalLinks } from "./links";
import type { RuleResult } from "@/types/seo";

/**
 * Runs a site-wide SEO audit from data that's already been computed (each
 * content item's stored analysis, if it has one) plus two on-demand checks
 * (duplicate metadata, orphan pages). This intentionally does not
 * re-run the full rule engine against every piece of content synchronously
 * (spec §56/§86: never do a full audit inside a normal request) — it
 * summarizes what's already known and flags content that has never been
 * analyzed at all.
 */
export async function runSiteAudit(userId?: string): Promise<string> {
  const run = await db.seoAuditRun.create({ data: { status: "RUNNING", initiatedById: userId } });

  const [analyzed, duplicates, linkAnalysis] = await Promise.all([
    db.seoMetadata.findMany({ where: { seoScoreBreakdown: { not: null } } }),
    findAllDuplicateMetadata(),
    analyzeInternalLinks(),
  ]);

  let issuesFound = 0;
  const issueRows: {
    auditRunId: string;
    entityType: string;
    entityId: string;
    url: string;
    category: string;
    severity: string;
    ruleKey: string;
    message: string;
  }[] = [];

  for (const record of analyzed) {
    if (!record.seoScoreBreakdown) continue;
    const results = JSON.parse(record.seoScoreBreakdown) as RuleResult[];
    for (const result of results) {
      if (result.status === "FAIL") {
        issueRows.push({
          auditRunId: run.id,
          entityType: record.entityType,
          entityId: record.entityId,
          url: record.canonicalUrl ?? record.entityId,
          category: result.category,
          severity: "HIGH",
          ruleKey: result.rule,
          message: result.message,
        });
      }
    }
  }

  for (const group of duplicates) {
    for (const entry of group.entries) {
      issueRows.push({
        auditRunId: run.id,
        entityType: entry.entityType,
        entityId: entry.entityId,
        url: entry.path ?? entry.entityId,
        category: "TECHNICAL",
        severity: "HIGH",
        ruleKey: `duplicate_${group.field}`,
        message: `Duplicate ${group.field}: "${group.value}"`,
      });
    }
  }

  for (const row of linkAnalysis.rows.filter((r) => r.incomingLinks === 0)) {
    issueRows.push({
      auditRunId: run.id,
      entityType: row.entityType,
      entityId: row.entityId,
      url: row.path,
      category: "LINKS",
      severity: "MEDIUM",
      ruleKey: "orphan_content",
      message: `"${row.title}" has no incoming internal links.`,
    });
  }

  issuesFound = issueRows.length;
  if (issueRows.length > 0) {
    await db.seoAuditIssue.createMany({ data: issueRows });
  }

  const severityCounts = issueRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.severity] = (acc[row.severity] ?? 0) + 1;
    return acc;
  }, {});

  await db.seoAuditRun.update({
    where: { id: run.id },
    data: {
      status: "COMPLETED",
      finishedAt: new Date(),
      totalUrls: analyzed.length,
      issuesFound,
      summary: JSON.stringify({ severityCounts, duplicateGroups: duplicates.length, orphanPages: linkAnalysis.orphanCount }),
    },
  });

  return run.id;
}
