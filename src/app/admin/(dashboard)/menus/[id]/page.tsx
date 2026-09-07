import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { MenuItemTree } from "@/components/admin/menus/MenuItemTree";

export default async function MenuEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("menus.view");
  const { id } = await params;

  const [menu, pages, posts, categories] = await Promise.all([
    db.menu.findUnique({ where: { id }, include: { items: { orderBy: { order: "asc" } } } }),
    db.page.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true, slug: true }, orderBy: { title: "asc" } }),
    db.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true, slug: true }, orderBy: { title: "asc" } }),
    db.blogCategory.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
  ]);
  if (!menu) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/menus" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to menus
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{menu.name}</h1>
      </div>
      <MenuItemTree
        menuId={menu.id}
        initialName={menu.name}
        initialItems={menu.items}
        pages={pages}
        posts={posts}
        categories={categories}
      />
    </div>
  );
}
