import Link from "next/link";
import {
  Newspaper,
  CheckCircle2,
  FileEdit,
  CalendarClock,
  ClipboardCheck,
  FolderTree,
  Tags,
  Users,
  Gauge,
  AlertTriangle,
  Eye,
  Send,
  History,
} from "lucide-react";
import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";

export default async function BlogDashboardPage() {
  await requirePermission("blog.view");

  const [
    totalPosts,
    published,
    draft,
    scheduled,
    pendingReview,
    totalCategories,
    totalTags,
    totalAuthors,
    seoAggregate,
    seoCompleteCount,
    mostViewed,
    recentlyPublished,
    recentlyUpdated,
  ] = await Promise.all([
    db.blogPost.count(),
    db.blogPost.count({ where: { status: "PUBLISHED" } }),
    db.blogPost.count({ where: { status: "DRAFT" } }),
    db.blogPost.count({ where: { status: "SCHEDULED" } }),
    db.blogPost.count({ where: { status: "REVIEW" } }),
    db.blogCategory.count(),
    db.blogTag.count(),
    db.blogAuthor.count(),
    db.seoMetadata.aggregate({ where: { entityType: "post" }, _avg: { seoScore: true } }),
    db.seoMetadata.count({
      where: {
        entityType: "post",
        AND: [{ title: { not: null } }, { title: { not: "" } }, { description: { not: null } }, { description: { not: "" } }],
      },
    }),
    db.blogPost.findMany({ where: { viewCount: { gt: 0 } }, orderBy: { viewCount: "desc" }, take: 5, select: { id: true, title: true, slug: true, viewCount: true } }),
    db.blogPost.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 5, select: { id: true, title: true, slug: true, publishedAt: true } }),
    db.blogPost.findMany({ orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, slug: true, updatedAt: true, status: true } }),
  ]);

  const avgSeoScore = seoAggregate._avg.seoScore != null ? Math.round(seoAggregate._avg.seoScore) : null;
  const postsMissingSeo = Math.max(0, totalPosts - seoCompleteCount);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog Dashboard</h1>
          <p className="text-sm text-muted-foreground">Content health, publishing pipeline, and top-performing posts.</p>
        </div>
        <Link href="/admin/blog/posts/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          New post
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Posts" value={formatNumber(totalPosts)} icon={Newspaper} />
        <StatCard label="Published" value={formatNumber(published)} icon={CheckCircle2} tone="success" />
        <StatCard label="Draft" value={formatNumber(draft)} icon={FileEdit} />
        <StatCard label="Scheduled" value={formatNumber(scheduled)} icon={CalendarClock} />
        <StatCard label="Pending Review" value={formatNumber(pendingReview)} icon={ClipboardCheck} tone={pendingReview > 0 ? "warning" : "default"} />
        <StatCard label="Categories" value={formatNumber(totalCategories)} icon={FolderTree} />
        <StatCard label="Tags" value={formatNumber(totalTags)} icon={Tags} />
        <StatCard label="Authors" value={formatNumber(totalAuthors)} icon={Users} />
        <StatCard label="Average SEO Score" value={avgSeoScore ?? "—"} icon={Gauge} />
        <StatCard label="Posts Missing SEO" value={formatNumber(postsMissingSeo)} icon={AlertTriangle} tone={postsMissingSeo > 0 ? "warning" : "default"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" /> Most Viewed Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostViewed.length === 0 ? (
              <EmptyState title="No views recorded yet." description="View counts appear once a post has been visited on the public site." />
            ) : (
              <ul className="divide-y divide-border text-sm">
                {mostViewed.map((post) => (
                  <li key={post.id} className="flex items-center justify-between py-2 gap-2">
                    <Link href={`/admin/blog/posts/${post.id}`} className="truncate text-primary hover:underline">
                      {post.title}
                    </Link>
                    <span className="whitespace-nowrap text-muted-foreground">{formatNumber(post.viewCount)} views</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-muted-foreground" /> Recently Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentlyPublished.length === 0 ? (
              <EmptyState title="No blog posts have been published yet." />
            ) : (
              <ul className="divide-y divide-border text-sm">
                {recentlyPublished.map((post) => (
                  <li key={post.id} className="flex items-center justify-between py-2 gap-2">
                    <Link href={`/admin/blog/posts/${post.id}`} className="truncate text-primary hover:underline">
                      {post.title}
                    </Link>
                    <span className="whitespace-nowrap text-muted-foreground">{formatDate(post.publishedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" /> Recently Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentlyUpdated.length === 0 ? (
              <EmptyState title="No blog posts yet." description="Create your first post to get started." />
            ) : (
              <ul className="divide-y divide-border text-sm">
                {recentlyUpdated.map((post) => (
                  <li key={post.id} className="flex items-center justify-between gap-2 py-2">
                    <Link href={`/admin/blog/posts/${post.id}`} className="truncate text-primary hover:underline">
                      {post.title}
                    </Link>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <StatusBadge status={post.status} />
                      <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(post.updatedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
