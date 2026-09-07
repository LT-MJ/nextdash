import Link from "next/link";
import { Plus, FolderTree } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/admin/ecommerce/DeleteButton";

export default async function CategoriesPage() {
  await requirePermission("ecommerce.products");
  const categories = await db.productCategory.findMany({
    include: { parent: true, _count: { select: { products: true, children: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your catalog into categories.</p>
        </div>
        <Button asChild>
          <Link href="/admin/ecommerce/categories/new">
            <Plus className="h-4 w-4" /> New Category
          </Link>
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={FolderTree} title="No categories have been added yet." description="Create your first category to organize products." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Subcategories</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Link href={`/admin/ecommerce/categories/${category.id}`} className="font-medium text-primary hover:underline">
                    {category.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">/category/{category.slug}</p>
                </TableCell>
                <TableCell>{category.parent?.name ?? "—"}</TableCell>
                <TableCell>{category._count.products}</TableCell>
                <TableCell>{category._count.children}</TableCell>
                <TableCell>
                  <DeleteButton url={`/api/admin/ecommerce/categories/${category.id}`} confirmText={`Delete category "${category.name}"?`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
