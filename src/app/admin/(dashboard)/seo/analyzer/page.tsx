import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { findAllDuplicateMetadata } from "@/lib/seo/services/duplicates";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const FIELD_LABEL: Record<string, string> = { title: "Duplicate SEO title", description: "Duplicate meta description", canonicalUrl: "Duplicate canonical URL" };

export default async function SeoAnalyzerPage() {
  await requirePermission("seo.view");
  const duplicates = await findAllDuplicateMetadata();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SEO Analyzer</h1>
        <p className="text-sm text-muted-foreground">
          Duplicate metadata detection across all analyzed content. For a full per-page breakdown (keywords, content, links, images,
          schema), open any item&apos;s SEO editor from <Link href="/admin/seo/content" className="text-primary underline">Content SEO</Link>.
        </p>
      </div>

      {duplicates.length === 0 ? (
        <EmptyState icon={Search} title="No duplicate metadata detected." description="Titles, descriptions, and canonical URLs are unique across analyzed content." />
      ) : (
        <div className="space-y-4">
          {duplicates.map((group, idx) => (
            <Card key={`${group.field}-${idx}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {FIELD_LABEL[group.field]}
                  <Badge variant="warning">{group.entries.length} pages</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">&ldquo;{group.value}&rdquo;</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {group.entries.map((entry) => (
                    <li key={`${entry.entityType}-${entry.entityId}`}>
                      <Link href={`/admin/seo/content/${entry.entityType}/${entry.entityId}`} className="text-primary hover:underline">
                        {entry.label}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">{entry.path}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
