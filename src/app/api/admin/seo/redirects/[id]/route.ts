import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { redirectInputSchema } from "@/lib/seo/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.redirects")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = redirectInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.redirect.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.redirect.update({ where: { id }, data: parsed.data });
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "redirect.update",
      entityType: "redirect",
      entityId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updated),
    },
  });
  return NextResponse.json({ redirect: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.redirects")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await db.redirect.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.redirect.delete({ where: { id } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "redirect.delete", entityType: "redirect", entityId: id, oldValue: JSON.stringify(existing) },
  });
  return NextResponse.json({ success: true });
}
