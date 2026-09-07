import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PostsTable } from "@/components/admin/blog/PostsTable";
import { formatNumber } from "@/lib/utils";

const PAGE_SIZE = 20;
const STATUSES = ["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

interface SearchParams {
  page?: string;
  status?: string;
  category?: string;
  author?: string;
  search?: string;
}

export default async function PostsListPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requirePermission("blog.view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = sp.status ?? "";
  const categoryId = sp.category ?? "";
  const authorId = sp.author ?? "";
  const search = sp.search?.trim() ?? "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (authorId) where.authorId = authorId;
  if (search) where.title = { contains: search };

  const [total, posts, categories, authors] = await Promise.all([
    db.blogPost.count({ where }),
    db.blogPost.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { author: { select: { name: true } }, category: { select: { name: true } } },
    }),
    db.blogCategory.findMany({ orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } }),
    db.blogAuthor.findMany({ orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } }),
  ]);

  const seoRecords =
    posts.length > 0
      ? await db.seoMetadata.findMany({
          where: { entityType: "post", entityId: { in: posts.map((p) => p.id) } },
          select: { entityId: true, seoScore: true, seoGrade: true },
        })
      : [];
  const seoByPost = new Map(seoRecords.map((r) => [r.entityId, r]));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows = posts.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    authorName: p.author?.name ?? null,
    categoryName: p.category?.name ?? null,
    seoScore: seoByPost.get(p.id)?.seoScore ?? null,
    seoGrade: seoByPost.get(p.id)?.seoGrade ?? null,
    updatedAt: p.updatedAt.toISOString(),
  }));

  function pageHref(target: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (categoryId) params.set("category", categoryId);
    if (authorId) params.set("author", authorId);
    if (search) params.set("search", search);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return `/admin/blog/posts${qs ? `?${qs}` : ""}`;
  }

  const hasFilters = !!(status || categoryId || authorId || search);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <p className="text-sm text-muted-foreground">{formatNumber(total)} post(s)</p>
        </div>
        <Link href="/admin/blog/posts/new">
          <Button>
            <Plus className="h-4 w-4" /> New post
          </Button>
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <Input id="search" name="search" defaultValue={search} placeholder="Search by title…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue={status} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select id="category" name="category" defaultValue={categoryId} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="author">Author</Label>
          <select id="author" name="author" defaultValue={authorId} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All authors</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {hasFilters ? (
          <Link href="/admin/blog/posts" className="text-sm text-muted-foreground underline">
            Clear
          </Link>
        ) : null}
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={hasFilters ? "No posts match these filters." : "No blog posts yet."}
          description={hasFilters ? "Try adjusting your filters." : "Create your first post to get started."}
        />
      ) : (
        <>
          <PostsTable posts={rows} />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Link
                href={pageHref(Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={`rounded-md border border-input px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}
              >
                Previous
              </Link>
              <Link
                href={pageHref(Math.min(totalPages, page + 1))}
                aria-disabled={page >= totalPages}
                className={`rounded-md border border-input px-3 py-1.5 ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-accent"}`}
              >
                Next
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
