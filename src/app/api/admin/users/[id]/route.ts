import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";

const updateSchema = z.object({
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "system.users")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  if (id === session.user.id && parsed.data.isActive === false) {
    return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.user.update({ where: { id }, data: parsed.data });
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "user.update",
      entityType: "user",
      entityId: id,
      oldValue: JSON.stringify({ roleId: existing.roleId, isActive: existing.isActive }),
      newValue: JSON.stringify(parsed.data),
    },
  });
  return NextResponse.json({ success: true, user: { id: updated.id, roleId: updated.roleId, isActive: updated.isActive } });
}
