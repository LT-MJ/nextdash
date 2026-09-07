import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { CategoriesManager } from "@/components/admin/blog/CategoriesManager";

export default async function CategoriesPage() {
  const session = await requirePermission("blog.view");

  const categories = await db.blogCategory.findMany({
    orderBy: { name: "asc" },
    include: { parent: { select: { name: true } }, _count: { select: { posts: true } } },
  });

  const rows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    parentId: c.parentId,
    parentName: c.parent?.name ?? null,
    featuredImage: c.featuredImage,
    postCount: c._count.posts,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">Organize posts into a category hierarchy.</p>
      </div>
      <CategoriesManager categories={rows} canEdit={session.user.permissions.includes("blog.edit")} />
    </div>
  );
}
