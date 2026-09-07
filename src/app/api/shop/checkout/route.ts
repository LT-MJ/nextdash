import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { checkoutSchema } from "@/lib/ecommerce/validation";
import { priceCartItems } from "@/lib/ecommerce/cart";
import { computeOrderTotals } from "@/lib/ecommerce/pricing";
import { validateCoupon } from "@/lib/ecommerce/coupons";
import { generateOrderNumber } from "@/lib/ecommerce/orders";
import { round2 } from "@/lib/ecommerce/money";

/**
 * Real order pipeline, no payment gateway: this is intentionally a manual /
 * invoice-style checkout (see project ground rules — no Stripe keys are
 * configured in this environment, so we never simulate charging a card).
 * The order is created as PENDING/UNPAID; an admin marks it PAID by hand
 * (or a real gateway would be wired in right here, before order creation,
 * and would flip paymentStatus via a webhook instead of the admin action).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  // Ignore any price/name the client might have sent alongside these ids —
  // re-derive everything from the database.
  const priced = await priceCartItems(input.items);

  const problems: string[] = [];
  for (const line of priced.lines) {
    if (!line.found) problems.push(`A product in your cart is no longer available.`);
    else if (!line.purchasable) problems.push(`"${line.name}" is not currently available for purchase.`);
    else if (line.quantity > line.availableStock) problems.push(`Only ${line.availableStock} of "${line.name}" left in stock.`);
  }
  if (problems.length > 0) {
    return NextResponse.json({ error: problems[0], issues: problems }, { status: 400 });
  }

  let discountTotal = 0;
  let couponId: string | null = null;
  if (input.couponCode) {
    const couponResult = await validateCoupon(input.couponCode, priced.subtotal, priced.productIds, input.customerEmail, priced.categoryIds);
    if (!couponResult.valid) {
      return NextResponse.json({ error: couponResult.error ?? "Invalid coupon." }, { status: 400 });
    }
    discountTotal = couponResult.discount ?? 0;
    couponId = couponResult.couponId ?? null;
  }

  const totals = computeOrderTotals(priced.subtotal, discountTotal);

  try {
    const order = await db.$transaction(async (tx) => {
      // Re-check stock inside the transaction to close the race window
      // between the pre-check above and now.
      for (const line of priced.lines) {
        const inventoryItem = line.variantId
          ? await tx.inventoryItem.findFirst({ where: { variantId: line.variantId } })
          : await tx.inventoryItem.findFirst({ where: { productId: line.productId, variantId: null } });
        if (!inventoryItem || inventoryItem.stock < line.quantity) {
          throw new Error(`Insufficient stock for "${line.name}".`);
        }
      }

      const customer = await tx.customer.upsert({
        where: { email: input.customerEmail },
        update: { name: input.customerName },
        create: { email: input.customerEmail, name: input.customerName },
      });

      const orderNumber = generateOrderNumber();
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          status: "PENDING",
          paymentStatus: "UNPAID",
          fulfillmentStatus: "UNFULFILLED",
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          shippingTotal: totals.shippingTotal,
          taxTotal: totals.taxTotal,
          total: totals.total,
          currency: "USD",
          couponId,
          shippingAddress: JSON.stringify(input.shippingAddress),
          billingAddress: JSON.stringify(input.billingAddress ?? input.shippingAddress),
        },
      });

      for (const line of priced.lines) {
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: line.productId,
            variantId: line.variantId,
            name: line.name,
            sku: line.sku,
            price: line.price,
            quantity: line.quantity,
            total: round2(line.price * line.quantity),
          },
        });

        const inventoryItem = line.variantId
          ? await tx.inventoryItem.findFirst({ where: { variantId: line.variantId } })
          : await tx.inventoryItem.findFirst({ where: { productId: line.productId, variantId: null } });
        if (inventoryItem) {
          await tx.inventoryItem.update({ where: { id: inventoryItem.id }, data: { stock: inventoryItem.stock - line.quantity } });
          await tx.inventoryAdjustment.create({
            data: {
              inventoryItemId: inventoryItem.id,
              delta: -line.quantity,
              reason: `Order ${orderNumber} placed`,
              userId: null,
            },
          });
        }
      }

      if (couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }

      return createdOrder;
    });

    return NextResponse.json({ order: { id: order.id, orderNumber: order.orderNumber } }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
