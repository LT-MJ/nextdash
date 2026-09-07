import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { AuthorsManager } from "@/components/admin/blog/AuthorsManager";

export default async function AuthorsPage() {
  const session = await requirePermission("blog.view");

  const authors = await db.blogAuthor.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  const rows = authors.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    profileImage: a.profileImage,
    bio: a.bio,
    email: a.email,
    website: a.website,
    socialProfiles: JSON.parse(a.socialProfiles ?? "[]") as string[],
    postCount: a._count.posts,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Authors</h1>
        <p className="text-sm text-muted-foreground">Manage byline attribution and author profile pages.</p>
      </div>
      <AuthorsManager authors={rows} canEdit={session.user.permissions.includes("blog.edit")} />
    </div>
  );
}
