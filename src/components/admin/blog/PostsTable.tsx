"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SeoScoreBadge } from "@/components/seo/SeoScore";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { SeoGrade } from "@/types/seo";

export interface PostRow {
  id: string;
  title: string;
  status: string;
  authorName: string | null;
  categoryName: string | null;
  seoScore: number | null;
  seoGrade: string | null;
  updatedAt: string;
}

const BULK_STATUSES = ["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;

/**
 * Client half of the posts list: renders the table with row checkboxes and
 * a bulk-status action bar (spec item 2 — "bulk selection + bulk status
 * change"). The list itself is computed server-side by the parent page.
 */
export function PostsTable({ posts }: { posts: PostRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("ARCHIVED");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allSelected = posts.length > 0 && selected.size === posts.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(posts.map((p) => p.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function applyBulk() {
    setError(null);
    const res = await fetch("/api/admin/blog/posts/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], status: bulkStatus }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Bulk update failed.");
      return;
    }
    setSelected(new Set());
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            {BULK_STATUSES.map((s) => (
              <option key={s} value={s}>
                Set status: {s}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={applyBulk} disabled={pending}>
            {pending ? "Applying…" : "Apply"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear selection
          </Button>
          {error ? <span className="text-destructive">{error}</span> : null}
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-input" aria-label="Select all posts" />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>SEO Score</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selected.has(post.id)}
                  onChange={() => toggleOne(post.id)}
                  className="h-4 w-4 rounded border-input"
                  aria-label={`Select ${post.title}`}
                />
              </TableCell>
              <TableCell>
                <Link href={`/admin/blog/posts/${post.id}`} className="font-medium text-primary hover:underline">
                  {post.title}
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={post.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{post.authorName ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{post.categoryName ?? "—"}</TableCell>
              <TableCell>
                <SeoScoreBadge score={post.seoScore} grade={post.seoGrade as SeoGrade | null} />
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(post.updatedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
