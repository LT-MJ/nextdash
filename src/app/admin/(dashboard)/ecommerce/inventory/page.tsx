import { Boxes } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StockStatusBadge } from "@/components/admin/ecommerce/StockStatusBadge";
import { InventoryAdjustDialog } from "@/components/admin/ecommerce/InventoryAdjustDialog";
import { ListFilters } from "@/components/admin/ecommerce/ListFilters";
import { getStockStatus, type StockStatus } from "@/lib/ecommerce/inventory";
import { formatDateTime } from "@/lib/utils";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePermission("ecommerce.inventory");
  const { status } = await searchParams;

  const items = await db.inventoryItem.findMany({
    include: { product: true, variant: { include: { product: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const withStatus = items.map((item) => ({
    ...item,
    status: getStockStatus(item.stock, item.reorderThreshold),
    displayName: item.variant ? `${item.variant.product.name} — ${item.variant.name}` : item.product?.name ?? "Unknown item",
  }));

  const filtered = status ? withStatus.filter((i) => i.status === (status as StockStatus)) : withStatus;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">Stock levels across every product and variant.</p>
      </div>

      <ListFilters
        showSearch={false}
        selects={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "IN_STOCK", label: "In Stock" },
              { value: "LOW_STOCK", label: "Low Stock" },
              { value: "OUT_OF_STOCK", label: "Out of Stock" },
            ],
          },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Boxes} title="No inventory records match this filter." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Reorder at</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.displayName}</TableCell>
                <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                <TableCell>{item.stock}</TableCell>
                <TableCell>{item.reserved}</TableCell>
                <TableCell>{item.stock - item.reserved}</TableCell>
                <TableCell>{item.reorderThreshold}</TableCell>
                <TableCell>
                  <StockStatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(item.updatedAt)}</TableCell>
                <TableCell>
                  <InventoryAdjustDialog inventoryItemId={item.id} sku={item.sku} currentStock={item.stock} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
