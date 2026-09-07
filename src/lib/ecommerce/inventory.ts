import { db } from "@/lib/server/db";
import type { Prisma } from "@prisma/client";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export function getStockStatus(stock: number, reorderThreshold: number): StockStatus {
  if (stock <= 0) return "OUT_OF_STOCK";
  if (stock <= reorderThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}

/**
 * Transactionally adjusts an InventoryItem's stock by `delta` (positive to
 * add, negative to remove), writing an InventoryAdjustment audit row.
 * Never allows the resulting stock to go negative — throws instead.
 *
 * Runs its own `$transaction` when not already given one via `tx`, so it can
 * be composed inside a larger transaction (e.g. order creation/cancellation).
 */
export async function adjustInventory(
  inventoryItemId: string,
  delta: number,
  reason: string,
  userId: string | null,
  tx?: Prisma.TransactionClient
): Promise<{ id: string; stock: number }> {
  const client = tx ?? db;

  const run = async (c: Prisma.TransactionClient) => {
    const item = await c.inventoryItem.findUnique({ where: { id: inventoryItemId } });
    if (!item) throw new Error("Inventory item not found");
    const nextStock = item.stock + delta;
    if (nextStock < 0) {
      throw new Error(`Adjustment would result in negative stock (current: ${item.stock}, delta: ${delta}).`);
    }
    const updated = await c.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { stock: nextStock },
    });
    await c.inventoryAdjustment.create({
      data: { inventoryItemId, delta, reason, userId },
    });
    return { id: updated.id, stock: updated.stock };
  };

  if (tx) return run(client);
  return db.$transaction((trx) => run(trx));
}
