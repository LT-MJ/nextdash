import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { analyzeInternalLinks } from "@/lib/seo/services/links";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/StatCard";
import { Link2, FileWarning } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default async function InternalLinksPage() {
  await requirePermission("seo.view");
  const { rows, orphanCount } = await analyzeInternalLinks();
  const sorted = [...rows].sort((a, b) => a.incomingLinks - b.incomingLinks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Internal Links</h1>
        <p className="text-sm text-muted-foreground">Incoming/outgoing link counts across published posts and pages (last 500 of each).</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Content analyzed" value={rows.length} icon={Link2} />
        <StatCard label="Orphan pages (0 incoming links)" value={orphanCount} icon={FileWarning} tone={orphanCount > 0 ? "warning" : "default"} />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No published content to analyze yet." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Incoming links</TableHead>
              <TableHead>Outgoing internal</TableHead>
              <TableHead>Outgoing external</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={`${row.entityType}-${row.entityId}`}>
                <TableCell>
                  <Link href={`/admin/seo/content/${row.entityType}/${row.entityId}`} className="font-medium text-primary hover:underline">
                    {row.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{row.path}</p>
                </TableCell>
                <TableCell>
                  {row.incomingLinks === 0 ? <Badge variant="destructive">Orphan</Badge> : row.incomingLinks}
                </TableCell>
                <TableCell>{row.outgoingInternalLinks}</TableCell>
                <TableCell>{row.outgoingExternalLinks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
