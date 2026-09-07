import { round2 } from "./money";

/**
 * Shipping/tax are intentionally simplified placeholders — there is no real
 * shipping-rate or tax-jurisdiction integration configured in this
 * environment. Documented here so the real numbers are easy to find and
 * swap out for a carrier-rate API / tax service later.
 */
export const FLAT_SHIPPING_RATE = 5.99;
export const FREE_SHIPPING_THRESHOLD = 75;
/** Placeholder flat tax rate (0%) until a real tax integration is wired up. */
export const TAX_RATE = 0;

export function computeShippingTotal(subtotalAfterDiscount: number): number {
  if (subtotalAfterDiscount <= 0) return 0;
  return subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
}

export function computeTaxTotal(subtotalAfterDiscount: number): number {
  return round2(subtotalAfterDiscount * TAX_RATE);
}

export interface OrderTotals {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
}

/** Authoritative order total computation — always recompute server-side from DB prices. */
export function computeOrderTotals(subtotal: number, discountTotal: number): OrderTotals {
  const subtotalAfterDiscount = Math.max(0, round2(subtotal - discountTotal));
  const shippingTotal = computeShippingTotal(subtotalAfterDiscount);
  const taxTotal = computeTaxTotal(subtotalAfterDiscount);
  const total = round2(subtotalAfterDiscount + shippingTotal + taxTotal);
  return { subtotal: round2(subtotal), discountTotal: round2(discountTotal), shippingTotal, taxTotal, total };
}
