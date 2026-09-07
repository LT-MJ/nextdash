import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SeoScoreBadge } from "@/components/seo/SeoScore";
import { formatDate } from "@/lib/utils";
import type { SeoGrade } from "@/types/seo";

export interface PageRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  seoScore: number | null;
  seoGrade: string | null;
  updatedAt: string;
}

export function PagesTable({ pages }: { pages: PageRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>SEO Score</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.map((page) => (
          <TableRow key={page.id}>
            <TableCell>
              <Link href={`/admin/pages/${page.id}`} className="font-medium text-primary hover:underline">
                {page.title}
              </Link>
              <p className="text-xs text-muted-foreground">/{page.slug}</p>
            </TableCell>
            <TableCell>
              <StatusBadge status={page.status} />
            </TableCell>
            <TableCell>
              <SeoScoreBadge score={page.seoScore} grade={page.seoGrade as SeoGrade | null} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(page.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
