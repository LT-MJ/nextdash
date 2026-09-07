import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { getAllContentAdapters } from "@/lib/seo/content-registry";
import { listContentWithSeo } from "@/lib/seo/services/content-list";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SeoScoreBadge } from "@/components/seo/SeoScore";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";
import type { ContentTypeKey } from "@/types/seo";

export default async function SeoContentPage({ searchParams }: { searchParams: Promise<{ entityType?: string }> }) {
  await requirePermission("seo.view");
  const { entityType: entityTypeParam } = await searchParams;
  const adapters = getAllContentAdapters().filter((a) => a.entityType !== "homepage" && a.entityType !== "author");
  const activeType = (entityTypeParam as ContentTypeKey) || adapters[0].entityType;

  const items = await listContentWithSeo(activeType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content SEO</h1>
          <p className="text-sm text-muted-foreground">Every SEO-enabled content type in one place.</p>
        </div>
        <Link href="/admin/seo/bulk-editor" className="text-sm text-primary underline">
          Bulk editor
        </Link>
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
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link href={`/admin/seo/content/${activeType}/${item.id}`} className="font-medium text-primary hover:underline">
                    {item.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">/{item.slug}</p>
                </TableCell>
                <TableCell>
                  <SeoScoreBadge score={item.seoScore} grade={item.seoGrade as never} />
                </TableCell>
                <TableCell>{item.hasTitle ? <Badge variant="success">Set</Badge> : <Badge variant="warning">Missing</Badge>}</TableCell>
                <TableCell>{item.hasDescription ? <Badge variant="success">Set</Badge> : <Badge variant="warning">Missing</Badge>}</TableCell>
                <TableCell>{!item.robotsIndex ? <Badge variant="destructive">Noindex</Badge> : <Badge variant="success">Indexable</Badge>}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(item.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
