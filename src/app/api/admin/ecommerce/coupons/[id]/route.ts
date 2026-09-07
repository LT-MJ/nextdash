import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { couponInputSchema } from "@/lib/ecommerce/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.coupons");
  if (error) return error;

  const { id } = await params;
  const existing = await db.coupon.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = couponInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (data.code) {
    const code = data.code.trim().toUpperCase();
    if (code !== existing.code) {
      const codeTaken = await db.coupon.findUnique({ where: { code } });
      if (codeTaken) return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });
    }
  }

  const updated = await db.coupon.update({
    where: { id },
    data: {
      ...(data.code !== undefined ? { code: data.code.trim().toUpperCase() } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.value !== undefined ? { value: data.value } : {}),
      ...(data.minPurchase !== undefined ? { minPurchase: data.minPurchase ?? null } : {}),
      ...(data.maxDiscount !== undefined ? { maxDiscount: data.maxDiscount ?? null } : {}),
      ...(data.usageLimit !== undefined ? { usageLimit: data.usageLimit ?? null } : {}),
      ...(data.perCustomerLimit !== undefined ? { perCustomerLimit: data.perCustomerLimit ?? null } : {}),
      ...(data.startsAt !== undefined ? { startsAt: data.startsAt ? new Date(data.startsAt) : null } : {}),
      ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.productRestrictions !== undefined ? { productRestrictions: JSON.stringify(data.productRestrictions) } : {}),
      ...(data.categoryRestrictions !== undefined ? { categoryRestrictions: JSON.stringify(data.categoryRestrictions) } : {}),
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "coupon.update", entityType: "coupon", entityId: id, oldValue: JSON.stringify(existing), newValue: JSON.stringify(updated) },
  });

  return NextResponse.json({ coupon: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.coupons");
  if (error) return error;

  const { id } = await params;
  const existing = await db.coupon.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.coupon.delete({ where: { id } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "coupon.delete", entityType: "coupon", entityId: id, oldValue: JSON.stringify(existing) },
  });

  return NextResponse.json({ success: true });
}
