import { ListTree } from "lucide-react";
import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { EmptyState } from "@/components/ui/empty-state";
import { MenusListClient } from "@/components/admin/menus/MenusListClient";

export default async function MenusListPage() {
  await requirePermission("menus.view");

  const [menus, headerFooter] = await Promise.all([
    db.menu.findMany({ orderBy: { updatedAt: "desc" }, include: { _count: { select: { items: true } } } }),
    db.headerFooterSettings.findUnique({ where: { id: "default" }, select: { primaryMenuId: true, footerColumns: true } }),
  ]);

  const footerColumns: { menuId?: string; heading: string }[] = headerFooter?.footerColumns ? JSON.parse(headerFooter.footerColumns) : [];

  const rows = menus.map((menu) => {
    const usages: string[] = [];
    if (headerFooter?.primaryMenuId === menu.id) usages.push("Primary navigation");
    footerColumns.forEach((col) => {
      if (col.menuId === menu.id) usages.push(`Footer: ${col.heading}`);
    });
    return { id: menu.id, name: menu.name, itemCount: menu._count.items, usages };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Menus</h1>
        <p className="text-sm text-muted-foreground">Build navigation menus, then assign them to the primary nav or a footer column in Header &amp; Footer settings.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={ListTree} title="No menus yet." description="Create a menu, add links to pages, posts, categories, or custom URLs, then assign it in Header & Footer settings." />
      ) : null}
      <MenusListClient menus={rows} />
    </div>
  );
}
