import Link from "next/link";
import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { getAllContentAdapters } from "@/lib/seo/content-registry";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SeoScoreBadge } from "@/components/seo/SeoScore";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";
import type { ContentTypeKey } from "@/types/seo";

const LISTERS: Record<ContentTypeKey, () => Promise<{ id: string; title: string; slug: string; status?: string; updatedAt: Date }[]>> = {
  page: async () => db.page.findMany({ orderBy: { updatedAt: "desc" }, take: 100 }),
  post: async () => db.blogPost.findMany({ orderBy: { updatedAt: "desc" }, take: 100 }),
  product: async () => (await db.product.findMany({ orderBy: { updatedAt: "desc" }, take: 100 })).map((p) => ({ ...p, title: p.name })),
  category: async () => (await db.blogCategory.findMany({ take: 100 })).map((c) => ({ ...c, title: c.name, updatedAt: new Date() })),
  product_category: async () => (await db.productCategory.findMany({ take: 100 })).map((c) => ({ ...c, title: c.name, updatedAt: new Date() })),
  collection: async () => (await db.collection.findMany({ take: 100 })).map((c) => ({ ...c, title: c.name, updatedAt: new Date() })),
  author: async () => (await db.blogAuthor.findMany({ take: 100 })).map((a) => ({ ...a, title: a.name, updatedAt: new Date() })),
  homepage: async () => [],
};

export default async function SeoContentPage({ searchParams }: { searchParams: Promise<{ entityType?: string }> }) {
  await requirePermission("seo.view");
  const { entityType: entityTypeParam } = await searchParams;
  const adapters = getAllContentAdapters().filter((a) => a.entityType !== "homepage" && a.entityType !== "author");
  const activeType = (entityTypeParam as ContentTypeKey) || adapters[0].entityType;

  const items = await LISTERS[activeType]();
  const seoRecords = await db.seoMetadata.findMany({
    where: { entityType: activeType, entityId: { in: items.map((i) => i.id) } },
  });
  const seoByEntity = new Map(seoRecords.map((r) => [r.entityId, r]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content SEO</h1>
        <p className="text-sm text-muted-foreground">Every SEO-enabled content type in one place.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {adapters.map((adapter) => (
          <Link
            key={adapter.entityType}
            href={`/admin/seo/content?entityType=${adapter.entityType}`}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              activeType === adapter.entityType ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {adapter.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={FileText} title={`No ${adapters.find((a) => a.entityType === activeType)?.label.toLowerCase()} yet.`} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>SEO Score</TableHead>
              <TableHead>Title status</TableHead>
              <TableHead>Description status</TableHead>
              <TableHead>Index status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const seo = seoByEntity.get(item.id);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/admin/seo/content/${activeType}/${item.id}`} className="font-medium text-primary hover:underline">
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">/{item.slug}</p>
                  </TableCell>
                  <TableCell>
                    <SeoScoreBadge score={seo?.seoScore ?? null} grade={(seo?.seoGrade as never) ?? null} />
                  </TableCell>
                  <TableCell>{seo?.title ? <Badge variant="success">Set</Badge> : <Badge variant="warning">Missing</Badge>}</TableCell>
                  <TableCell>{seo?.description ? <Badge variant="success">Set</Badge> : <Badge variant="warning">Missing</Badge>}</TableCell>
                  <TableCell>
                    {seo?.robotsIndex === false ? <Badge variant="destructive">Noindex</Badge> : <Badge variant="success">Indexable</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(item.updatedAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
