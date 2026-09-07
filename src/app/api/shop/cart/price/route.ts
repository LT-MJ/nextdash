import { NextResponse } from "next/server";
import { priceCartItems } from "@/lib/ecommerce/cart";
import { computeOrderTotals } from "@/lib/ecommerce/pricing";
import { cartPriceSchema } from "@/lib/ecommerce/validation";

/**
 * Public endpoint: given a cart's {productId, variantId?, quantity}[] (as
 * held client-side in localStorage), return authoritative current prices,
 * stock, and totals straight from the database. The client never renders a
 * cached price as the real total — this is the only source of truth.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = cartPriceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const priced = await priceCartItems(parsed.data.items);
  const totals = computeOrderTotals(priced.subtotal, 0);

  return NextResponse.json({ lines: priced.lines, ...totals });
}
