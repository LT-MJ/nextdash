import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { orderStatusUpdateSchema } from "@/lib/ecommerce/validation";
import { canTransition } from "@/lib/ecommerce/order-state-machine";
import { applyOrderStatusTransition, InvalidTransitionError } from "@/lib/ecommerce/order-transitions";
import { db } from "@/lib/server/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.orders");
  if (error) return error;

  const { id } = await params;
  const existing = await db.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = orderStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  // Re-validated server-side regardless of what the client offered in its UI.
  if (!canTransition(existing.status, parsed.data.status)) {
    return NextResponse.json({ error: `Cannot transition order from ${existing.status} to ${parsed.data.status}.` }, { status: 400 });
  }

  try {
    const order = await applyOrderStatusTransition(id, parsed.data.status, session.user.id);
    return NextResponse.json({ order });
  } catch (e) {
    if (e instanceof InvalidTransitionError) return NextResponse.json({ error: e.message }, { status: 400 });
    const message = e instanceof Error ? e.message : "Failed to update order status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
