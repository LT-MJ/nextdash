import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { getStockStatus } from "@/lib/ecommerce/inventory";

export async function GET(request: Request) {
  const { error } = await requireApiPermission("ecommerce.inventory");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status"); // IN_STOCK | LOW_STOCK | OUT_OF_STOCK

  const items = await db.inventoryItem.findMany({
    include: { product: true, variant: { include: { product: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const withStatus = items.map((item) => ({
    ...item,
    status: getStockStatus(item.stock, item.reorderThreshold),
    available: item.stock - item.reserved,
    displayName: item.variant ? `${item.variant.product.name} — ${item.variant.name}` : item.product?.name ?? "Unknown",
  }));

  const filtered = statusFilter ? withStatus.filter((i) => i.status === statusFilter) : withStatus;

  return NextResponse.json({ items: filtered, total: filtered.length });
}
