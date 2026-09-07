/**
 * Order status state machine. This is the single source of truth for which
 * status transitions are legal — both the admin UI (to only offer valid next
 * statuses) and the status-update API route (to reject anything else with a
 * 400, regardless of what the client sends) must go through this module.
 */
export type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransition(from: string, to: string): boolean {
  const validFrom = TRANSITIONS[from as OrderStatus];
  if (!validFrom) return false;
  return validFrom.includes(to as OrderStatus);
}

export function getValidNextStatuses(current: string): OrderStatus[] {
  return TRANSITIONS[current as OrderStatus] ?? [];
}

export const ALL_ORDER_STATUSES: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
