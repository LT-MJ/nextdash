import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { TagsManager } from "@/components/admin/blog/TagsManager";

export default async function TagsPage() {
  const session = await requirePermission("blog.view");

  const tags = await db.blogTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  const rows = tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, description: t.description, postCount: t._count.posts }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
        <p className="text-sm text-muted-foreground">Label posts for fine-grained discovery. Unused tags are flagged for cleanup.</p>
      </div>
      <TagsManager tags={rows} canEdit={session.user.permissions.includes("blog.edit")} />
    </div>
  );
}
