import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { couponInputSchema } from "@/lib/ecommerce/validation";

export async function GET() {
  const { error } = await requireApiPermission("ecommerce.coupons");
  if (error) return error;

  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(request: Request) {
  const { session, error } = await requireApiPermission("ecommerce.coupons");
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = couponInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const code = data.code.trim().toUpperCase();

  const existing = await db.coupon.findUnique({ where: { code } });
  if (existing) return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });

  if (data.type === "PERCENTAGE" && data.value > 100) {
    return NextResponse.json({ error: "Percentage discounts cannot exceed 100." }, { status: 400 });
  }

  const coupon = await db.coupon.create({
    data: {
      code,
      type: data.type,
      value: data.value,
      minPurchase: data.minPurchase ?? null,
      maxDiscount: data.maxDiscount ?? null,
      usageLimit: data.usageLimit ?? null,
      perCustomerLimit: data.perCustomerLimit ?? null,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      active: data.active,
      productRestrictions: JSON.stringify(data.productRestrictions ?? []),
      categoryRestrictions: JSON.stringify(data.categoryRestrictions ?? []),
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "coupon.create", entityType: "coupon", entityId: coupon.id, newValue: JSON.stringify(coupon) },
  });

  return NextResponse.json({ coupon }, { status: 201 });
}
