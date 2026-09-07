import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { PostEditorForm } from "@/components/admin/blog/PostEditorForm";

export default async function NewPostPage() {
  const session = await requirePermission("blog.edit");

  const [categories, tags, authors] = await Promise.all([
    db.blogCategory.findMany({ orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } }),
    db.blogTag.findMany({ orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } }),
    db.blogAuthor.findMany({ orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/blog/posts" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to posts
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New post</h1>
        <p className="text-sm text-muted-foreground">SEO settings and revision history become available after the first save.</p>
      </div>
      <PostEditorForm post={null} categories={categories} tags={tags} authors={authors} canPublish={session.user.permissions.includes("blog.publish")} />
    </div>
  );
}
