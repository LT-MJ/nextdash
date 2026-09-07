import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import { reviewStatusUpdateSchema } from "@/lib/ecommerce/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { session, error } = await requireApiPermission("ecommerce.reviews");
  if (error) return error;

  const { id } = await params;
  const existing = await db.review.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = reviewStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db.review.update({ where: { id }, data: { status: parsed.data.status } });
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "review.status.change",
      entityType: "review",
      entityId: id,
      oldValue: JSON.stringify(existing.status),
      newValue: JSON.stringify(updated.status),
    },
  });

  return NextResponse.json({ review: updated });
}
