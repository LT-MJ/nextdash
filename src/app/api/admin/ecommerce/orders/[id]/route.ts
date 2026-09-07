import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { orderNotesUpdateSchema } from "@/lib/ecommerce/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { error } = await requireApiPermission("ecommerce.orders");
  if (error) return error;

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { customer: true, coupon: true, items: { include: { product: true, variant: true } } },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.orders");
  if (error) return error;

  const { id } = await params;
  const existing = await db.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = orderNotesUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db.order.update({ where: { id }, data: { notes: parsed.data.notes } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "order.notes.update", entityType: "order", entityId: id, oldValue: JSON.stringify(existing.notes), newValue: JSON.stringify(updated.notes) },
  });

  return NextResponse.json({ order: updated });
}
