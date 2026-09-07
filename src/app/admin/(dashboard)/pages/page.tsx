import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PagesTable } from "@/components/admin/pages/PagesTable";
import { formatNumber } from "@/lib/utils";

export default async function PagesListPage() {
  await requirePermission("pages.view");

  const pages = await db.page.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
  const seoRecords =
    pages.length > 0
      ? await db.seoMetadata.findMany({
          where: { entityType: "page", entityId: { in: pages.map((p) => p.id) } },
          select: { entityId: true, seoScore: true, seoGrade: true },
        })
      : [];
  const seoByPage = new Map(seoRecords.map((r) => [r.entityId, r]));

  const rows = pages.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    seoScore: seoByPage.get(p.id)?.seoScore ?? null,
    seoGrade: seoByPage.get(p.id)?.seoGrade ?? null,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
          <p className="text-sm text-muted-foreground">{formatNumber(pages.length)} page(s) — standalone site pages like About, Contact, or a Privacy Policy.</p>
        </div>
        <Link href="/admin/pages/new">
          <Button>
            <Plus className="h-4 w-4" /> New page
          </Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No pages have been created yet."
          description="Create your first page — it'll be reachable at its own URL, included in the sitemap once published, and gets the full SEO editor."
          action={
            <Link href="/admin/pages/new">
              <Button>
                <Plus className="h-4 w-4" /> New page
              </Button>
            </Link>
          }
        />
      ) : (
        <PagesTable pages={rows} />
      )}
    </div>
  );
}
