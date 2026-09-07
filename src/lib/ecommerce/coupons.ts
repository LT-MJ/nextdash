import { db } from "@/lib/server/db";
import { round2 } from "./money";

export interface CouponValidationResult {
  valid: boolean;
  discount?: number;
  error?: string;
  couponId?: string;
}

/**
 * The single authoritative place coupon math happens. Called from the
 * checkout API route server-side — never trust a discount amount the client
 * might send. Product/category restrictions are interpreted as "the cart
 * must contain at least one item from the restricted set" (a coupon scoped
 * to a promo category still requires something from that category in cart);
 * the resulting discount still applies to the whole order subtotal, which is
 * the simplest honest behavior given the schema has no per-line discount.
 */
export async function validateCoupon(
  code: string,
  cartSubtotal: number,
  cartProductIds: string[],
  customerEmail?: string | null,
  cartCategoryIds: string[] = []
): Promise<CouponValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { valid: false, error: "No coupon code provided." };

  const coupon = await db.coupon.findUnique({ where: { code: normalized } });
  if (!coupon) return { valid: false, error: "Invalid coupon code." };
  if (!coupon.active) return { valid: false, error: "This coupon is no longer active." };

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) return { valid: false, error: "This coupon is not yet valid." };
  if (coupon.endsAt && now > coupon.endsAt) return { valid: false, error: "This coupon has expired." };

  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: "This coupon has reached its usage limit." };
  }

  if (coupon.perCustomerLimit != null && customerEmail) {
    const usedByCustomer = await db.order.count({
      where: {
        couponId: coupon.id,
        customer: { email: customerEmail },
        status: { notIn: ["CANCELLED"] },
      },
    });
    if (usedByCustomer >= coupon.perCustomerLimit) {
      return { valid: false, error: "You have already used this coupon the maximum number of times." };
    }
  }

  if (coupon.minPurchase != null && cartSubtotal < coupon.minPurchase) {
    return { valid: false, error: `A minimum purchase of ${coupon.minPurchase.toFixed(2)} is required for this coupon.` };
  }

  const productRestrictions: string[] = coupon.productRestrictions ? JSON.parse(coupon.productRestrictions) : [];
  const categoryRestrictions: string[] = coupon.categoryRestrictions ? JSON.parse(coupon.categoryRestrictions) : [];

  if (productRestrictions.length > 0) {
    const matches = cartProductIds.some((id) => productRestrictions.includes(id));
    if (!matches) return { valid: false, error: "This coupon does not apply to the items in your cart." };
  }

  if (categoryRestrictions.length > 0) {
    const matches = cartCategoryIds.some((id) => categoryRestrictions.includes(id));
    if (!matches) return { valid: false, error: "This coupon does not apply to the items in your cart." };
  }

  let discount = coupon.type === "PERCENTAGE" ? cartSubtotal * (coupon.value / 100) : coupon.value;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, cartSubtotal); // never discount more than the subtotal
  discount = round2(Math.max(0, discount));

  return { valid: true, discount, couponId: coupon.id };
}
