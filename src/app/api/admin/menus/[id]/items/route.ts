import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { menuItemInputSchema } from "@/lib/menus/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthorizedSession("menus.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: menuId } = await params;
  const menu = await db.menu.findUnique({ where: { id: menuId }, select: { id: true } });
  if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = menuItemInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const maxOrder = await db.menuItem.aggregate({ where: { menuId }, _max: { order: true } });

  const created = await db.menuItem.create({
    data: {
      menuId,
      parentId: data.parentId || null,
      label: data.label,
      linkType: data.linkType,
      url: data.url || null,
      targetId: data.targetId || null,
      openInNewTab: data.openInNewTab,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "menu_item.create", entityType: "menu_item", entityId: created.id, newValue: JSON.stringify({ menuId, label: created.label }) },
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
