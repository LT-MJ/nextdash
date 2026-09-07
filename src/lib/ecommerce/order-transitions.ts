import { db } from "@/lib/server/db";
import { canTransition, type OrderStatus } from "./order-state-machine";
import { round2 } from "./money";

export class InvalidTransitionError extends Error {}

/**
 * Applies an order status transition with all of its side effects, inside a
 * single transaction:
 *  - re-validates the transition against the state machine (never trust the
 *    caller — the API route also checks, but this is the true guard)
 *  - PENDING -> PAID also sets paymentStatus to PAID
 *  - PENDING -> CANCELLED restores the inventory that was decremented at
 *    order-creation time (reverses each OrderItem's quantity back onto its
 *    InventoryItem)
 *  - Customer.totalSpent/ordersCount/lastOrderAt are denormalized fields we
 *    keep in sync transactionally right here (rather than recomputing them
 *    live on every customer page load) — PAID adds to the customer's
 *    lifetime value, REFUNDED subtracts it back out. This is the "update
 *    transactionally" option called out in the spec; the customer pages
 *    trust these fields rather than re-aggregating orders each render.
 *  - writes an ActivityLog row for the transition
 */
export async function applyOrderStatusTransition(orderId: string, nextStatus: OrderStatus, userId: string | null) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new Error("Order not found");

    if (!canTransition(order.status, nextStatus)) {
      throw new InvalidTransitionError(`Cannot transition order from ${order.status} to ${nextStatus}.`);
    }

    const data: { status: OrderStatus; paymentStatus?: string } = { status: nextStatus };
    if (nextStatus === "PAID") data.paymentStatus = "PAID";
    if (nextStatus === "REFUNDED") data.paymentStatus = "REFUNDED";

    const updated = await tx.order.update({ where: { id: orderId }, data });

    if (nextStatus === "CANCELLED") {
      for (const item of order.items) {
        if (!item.productId && !item.variantId) continue;
        const inventoryItem = item.variantId
          ? await tx.inventoryItem.findFirst({ where: { variantId: item.variantId } })
          : await tx.inventoryItem.findFirst({ where: { productId: item.productId!, variantId: null } });
        if (!inventoryItem) continue;

        await tx.inventoryItem.update({ where: { id: inventoryItem.id }, data: { stock: inventoryItem.stock + item.quantity } });
        await tx.inventoryAdjustment.create({
          data: {
            inventoryItemId: inventoryItem.id,
            delta: item.quantity,
            reason: `Order ${order.orderNumber} cancelled — stock restored`,
            userId,
          },
        });
      }
    }

    if (order.customerId) {
      if (nextStatus === "PAID") {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalSpent: round2((await tx.customer.findUniqueOrThrow({ where: { id: order.customerId } })).totalSpent + order.total),
            ordersCount: { increment: 1 },
            lastOrderAt: new Date(),
          },
        });
      } else if (nextStatus === "REFUNDED") {
        const customer = await tx.customer.findUniqueOrThrow({ where: { id: order.customerId } });
        await tx.customer.update({
          where: { id: order.customerId },
          data: { totalSpent: Math.max(0, round2(customer.totalSpent - order.total)) },
        });
      }
    }

    await tx.activityLog.create({
      data: {
        userId,
        action: "order.status.change",
        entityType: "order",
        entityId: orderId,
        field: "status",
        oldValue: JSON.stringify(order.status),
        newValue: JSON.stringify(nextStatus),
      },
    });

    return updated;
  });
}
