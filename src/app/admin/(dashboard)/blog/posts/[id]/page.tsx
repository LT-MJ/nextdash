import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { PostEditorForm, type PostEditorInitial } from "@/components/admin/blog/PostEditorForm";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("blog.edit");
  const { id } = await params;

  const [post, categories, tags, authors] = await Promise.all([
    db.blogPost.findUnique({ where: { id }, include: { tags: { select: { tagId: true } } } }),
    db.blogCategory.findMany({ orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } }),
    db.blogTag.findMany({ orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } }),
    db.blogAuthor.findMany({ orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } }),
  ]);

  if (!post) notFound();

  const initialPost: PostEditorInitial = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    featuredImage: post.featuredImage,
    gallery: JSON.parse(post.gallery ?? "[]"),
    authorId: post.authorId,
    categoryId: post.categoryId,
    tagIds: post.tags.map((t) => t.tagId),
    status: post.status,
    visibility: post.visibility,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : null,
    commentsEnabled: post.commentsEnabled,
    featured: post.featured,
    viewCount: post.viewCount,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/blog/posts" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to posts
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1>
        <p className="text-sm text-muted-foreground">
          {post.readingTimeMinutes ?? "—"} min read · {post.viewCount} view(s)
        </p>
      </div>
      <PostEditorForm post={initialPost} categories={categories} tags={tags} authors={authors} canPublish={session.user.permissions.includes("blog.publish")} />
    </div>
  );
}
