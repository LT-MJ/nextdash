import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { analyzeImageSeo } from "@/lib/seo/services/images";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/StatCard";
import { ImageIcon, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ImageSeoPage() {
  await requirePermission("seo.view");
  const { issues, totalImages } = await analyzeImageSeo();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Image SEO</h1>
        <p className="text-sm text-muted-foreground">ALT-text coverage across published posts, pages, and active products.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Images scanned" value={totalImages} icon={ImageIcon} />
        <StatCard label="Missing / empty ALT text" value={issues.length} icon={AlertTriangle} tone={issues.length > 0 ? "warning" : "default"} />
      </div>

      {issues.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No image ALT-text issues found." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Issue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Link href={`/admin/seo/content/${issue.entityType}/${issue.entityId}`} className="text-primary hover:underline">
                    {issue.title}
                  </Link>
                </TableCell>
                <TableCell className="max-w-xs truncate font-mono text-xs">{issue.src}</TableCell>
                <TableCell>
                  <Badge variant="warning">{issue.issue === "missing-alt" ? "Missing ALT" : "Empty ALT"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
