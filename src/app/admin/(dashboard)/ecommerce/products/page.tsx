import Link from "next/link";
import { Plus, ShoppingBag } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StockStatusBadge } from "@/components/admin/ecommerce/StockStatusBadge";
import { SeoScoreBadge } from "@/components/seo/SeoScore";
import { EmptyState } from "@/components/ui/empty-state";
import { ListFilters } from "@/components/admin/ecommerce/ListFilters";
import { Pagination } from "@/components/admin/ecommerce/Pagination";
import { formatCurrency } from "@/lib/utils";
import { getStockStatus } from "@/lib/ecommerce/inventory";
import type { Prisma } from "@prisma/client";
import type { SeoGrade } from "@/types/seo";

const PAGE_SIZE = 20;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; category?: string; search?: string }>;
}) {
  await requirePermission("ecommerce.products");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const status = sp.status;
  const categoryId = sp.category;
  const search = sp.search?.trim();

  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(search ? { OR: [{ name: { contains: search } }, { sku: { contains: search } }] } : {}),
  };

  const [products, total, categories] = await Promise.all([
    db.product.findMany({
      where,
      include: { category: true, inventory: true },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
    db.productCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  const seoRecords = await db.seoMetadata.findMany({
    where: { entityType: "product", entityId: { in: products.map((p) => p.id) } },
  });
  const seoByProduct = new Map(seoRecords.map((r) => [r.entityId, r]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog.</p>
        </div>
        <Button asChild>
          <Link href="/admin/ecommerce/products/new">
            <Plus className="h-4 w-4" /> New Product
          </Link>
        </Button>
      </div>

      <ListFilters
        searchPlaceholder="Search by name or SKU…"
        selects={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "DRAFT", label: "Draft" },
              { value: "ACTIVE", label: "Active" },
              { value: "ARCHIVED", label: "Archived" },
              { value: "OUT_OF_STOCK", label: "Out of Stock" },
            ],
          },
          {
            key: "category",
            label: "Category",
            options: categories.map((c) => ({ value: c.id, label: c.name })),
          },
        ]}
      />

      {products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No products have been added yet."
          description="Create your first product to start building your catalog."
          action={
            <Button asChild size="sm">
              <Link href="/admin/ecommerce/products/new">Add a product</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SEO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const totalStock = product.inventory.reduce((acc, i) => acc + i.stock, 0);
                const minThreshold = product.inventory.length > 0 ? Math.max(...product.inventory.map((i) => i.reorderThreshold)) : 0;
                const stockStatus = getStockStatus(totalStock, minThreshold);
                const seo = seoByProduct.get(product.id);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link href={`/admin/ecommerce/products/${product.id}`} className="font-medium text-primary hover:underline">
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">/{product.slug}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{product.sku ?? "—"}</TableCell>
                    <TableCell>{product.category?.name ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(product.price, product.currency)}</TableCell>
                    <TableCell>
                      <StockStatusBadge status={stockStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={product.status} />
                    </TableCell>
                    <TableCell>
                      <SeoScoreBadge score={seo?.seoScore ?? null} grade={(seo?.seoGrade as SeoGrade) ?? null} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/ecommerce/products" searchParams={{ status, category: categoryId, search }} />
        </>
      )}
    </div>
  );
}
