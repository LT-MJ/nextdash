import { AlertTriangle, FileWarning, Gauge, Link2, Map as MapIcon, Send, ShieldAlert } from "lucide-react";
import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeoScoreRing } from "@/components/seo/SeoScore";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function SeoDashboardPage() {
  await requirePermission("seo.view");

  const [
    aggregate,
    totalAnalyzed,
    criticalCount,
    warningCount,
    missingTitleCount,
    missingDescriptionCount,
    noindexCount,
    redirectCount,
    notFoundCount,
    pendingIndexing,
    worstPages,
    bestPages,
  ] = await Promise.all([
    db.seoMetadata.aggregate({ _avg: { seoScore: true } }),
    db.seoMetadata.count({ where: { seoScore: { not: null } } }),
    db.seoMetadata.count({ where: { seoGrade: "CRITICAL" } }),
    db.seoMetadata.count({ where: { seoGrade: "NEEDS_IMPROVEMENT" } }),
    db.seoMetadata.count({ where: { OR: [{ title: null }, { title: "" }] } }),
    db.seoMetadata.count({ where: { OR: [{ description: null }, { description: "" }] } }),
    db.seoMetadata.count({ where: { robotsIndex: false } }),
    db.redirect.count({ where: { enabled: true } }),
    db.notFoundLog.count({ where: { resolved: false, ignored: false } }),
    db.indexingQueueItem.count({ where: { status: "PENDING" } }),
    db.seoMetadata.findMany({ where: { seoScore: { not: null } }, orderBy: { seoScore: "asc" }, take: 5 }),
    db.seoMetadata.findMany({ where: { seoScore: { not: null } }, orderBy: { seoScore: "desc" }, take: 5 }),
  ]);

  const avgScore = aggregate._avg.seoScore ? Math.round(aggregate._avg.seoScore) : null;
  const grade = avgScore === null ? null : avgScore >= 85 ? "EXCELLENT" : avgScore >= 65 ? "GOOD" : avgScore >= 40 ? "NEEDS_IMPROVEMENT" : "CRITICAL";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SEO Dashboard</h1>
        <p className="text-sm text-muted-foreground">Site-wide SEO health, priority issues, and content performance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Analyzed Content" value={totalAnalyzed} icon={Gauge} />
        <StatCard label="Critical Issues" value={criticalCount} icon={AlertTriangle} tone={criticalCount > 0 ? "destructive" : "default"} />
        <StatCard label="Needs Improvement" value={warningCount} icon={ShieldAlert} tone={warningCount > 0 ? "warning" : "default"} />
        <StatCard label="Noindex Pages" value={noindexCount} icon={FileWarning} />
        <StatCard label="Missing Titles" value={missingTitleCount} icon={AlertTriangle} tone={missingTitleCount > 0 ? "warning" : "default"} />
        <StatCard label="Missing Descriptions" value={missingDescriptionCount} icon={AlertTriangle} tone={missingDescriptionCount > 0 ? "warning" : "default"} />
        <StatCard label="Active Redirects" value={redirectCount} icon={Link2} />
        <StatCard label="Unresolved 404s" value={notFoundCount} icon={FileWarning} tone={notFoundCount > 0 ? "warning" : "default"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>SEO Health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <SeoScoreRing score={avgScore} grade={grade} size={120} />
            <p className="text-center text-sm text-muted-foreground">Average score across {totalAnalyzed} analyzed item(s).</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Indexing & Sitemap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <span className="flex items-center gap-2"><MapIcon className="h-4 w-4 text-muted-foreground" /> Sitemap</span>
              <Link href="/admin/seo/sitemap" className="text-primary underline">Manage</Link>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <span className="flex items-center gap-2"><Send className="h-4 w-4 text-muted-foreground" /> Indexing queue</span>
              <span className="text-muted-foreground">{pendingIndexing} pending</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lowest-scoring content</CardTitle>
          </CardHeader>
          <CardContent>
            {worstPages.length === 0 ? (
              <EmptyState title="No SEO analysis has been run yet." description="Open a page's SEO editor to generate its first score." />
            ) : (
              <ul className="divide-y divide-border text-sm">
                {worstPages.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2">
                    <Link href={`/admin/seo/content/${item.entityType}/${item.entityId}`} className="truncate text-primary hover:underline">
                      {item.title || item.entityId}
                    </Link>
                    <span className="text-muted-foreground">{item.seoScore}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Best-performing content</CardTitle>
          </CardHeader>
          <CardContent>
            {bestPages.length === 0 ? (
              <EmptyState title="No SEO analysis has been run yet." />
            ) : (
              <ul className="divide-y divide-border text-sm">
                {bestPages.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2">
                    <Link href={`/admin/seo/content/${item.entityType}/${item.entityId}`} className="truncate text-primary hover:underline">
                      {item.title || item.entityId}
                    </Link>
                    <span className="text-muted-foreground">{item.seoScore}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">Last updated {formatDateTime(new Date())}</p>
    </div>
  );
}
