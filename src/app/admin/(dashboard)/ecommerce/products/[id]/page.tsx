import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StockStatusBadge } from "@/components/admin/ecommerce/StockStatusBadge";
import { ProductGeneralForm } from "@/components/admin/ecommerce/ProductGeneralForm";
import { ProductVariantsList } from "@/components/admin/ecommerce/ProductVariantsList";
import { InventoryAdjustDialog } from "@/components/admin/ecommerce/InventoryAdjustDialog";
import { SeoEditorPanel } from "@/components/seo/SeoEditorPanel";
import { getStockStatus } from "@/lib/ecommerce/inventory";
import { formatDateTime } from "@/lib/utils";

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("ecommerce.products");
  const { id } = await params;

  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: { orderBy: { position: "asc" }, include: { inventory: true } },
        inventory: { where: { variantId: null } },
      },
    }),
    db.productCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  const inventoryRows = [
    ...product.inventory.map((inv) => ({ inv, label: "Base product" })),
    ...product.variants.flatMap((v) => v.inventory.map((inv) => ({ inv, label: v.name }))),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/ecommerce/products" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Products
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-sm text-muted-foreground">/shop/{product.slug}</p>
        </div>
        <StatusBadge status={product.status} />
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <ProductGeneralForm mode="edit" categories={categories} initial={product} />
        </TabsContent>

        <TabsContent value="variants">
          <ProductVariantsList
            productId={product.id}
            variants={product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              barcode: v.barcode,
              image: v.image,
              weight: v.weight,
              options: v.options,
              position: v.position,
              productPrice: product.price,
              currency: product.currency,
            }))}
          />
        </TabsContent>

        <TabsContent value="inventory">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Reorder at</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryRows.map(({ inv, label }) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{label}</TableCell>
                  <TableCell className="font-mono text-xs">{inv.sku}</TableCell>
                  <TableCell>{inv.stock}</TableCell>
                  <TableCell>{inv.reserved}</TableCell>
                  <TableCell>{inv.reorderThreshold}</TableCell>
                  <TableCell>
                    <StockStatusBadge status={getStockStatus(inv.stock, inv.reorderThreshold)} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(inv.updatedAt)}</TableCell>
                  <TableCell>
                    <InventoryAdjustDialog inventoryItemId={inv.id} sku={inv.sku} currentStock={inv.stock} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="seo">
          <SeoEditorPanel entityType="product" entityId={product.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
