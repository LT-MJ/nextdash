import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { menuItemInputSchema } from "@/lib/menus/validation";

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("menus.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: menuId, itemId } = await params;
  const existing = await db.menuItem.findFirst({ where: { id: itemId, menuId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = menuItemInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (data.parentId === itemId) {
    return NextResponse.json({ error: "An item can't be nested under itself." }, { status: 400 });
  }

  const updated = await db.menuItem.update({
    where: { id: itemId },
    data: {
      parentId: data.parentId || null,
      label: data.label,
      linkType: data.linkType,
      url: data.url || null,
      targetId: data.targetId || null,
      openInNewTab: data.openInNewTab,
    },
  });

  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "menu_item.update",
      entityType: "menu_item",
      entityId: itemId,
      oldValue: JSON.stringify({ label: existing.label }),
      newValue: JSON.stringify({ label: updated.label }),
    },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("menus.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: menuId, itemId } = await params;
  const existing = await db.menuItem.findFirst({ where: { id: itemId, menuId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.menuItem.delete({ where: { id: itemId } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "menu_item.delete", entityType: "menu_item", entityId: itemId, oldValue: JSON.stringify({ label: existing.label }) },
  });

  return NextResponse.json({ success: true });
}
