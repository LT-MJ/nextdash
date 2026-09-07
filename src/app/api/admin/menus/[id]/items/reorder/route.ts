import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { menuItemReorderSchema } from "@/lib/menus/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthorizedSession("menus.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: menuId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = menuItemReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existingIds = new Set((await db.menuItem.findMany({ where: { menuId }, select: { id: true } })).map((i) => i.id));
  const items = parsed.data.items.filter((i) => existingIds.has(i.id) && i.parentId !== i.id);

  await db.$transaction(items.map((item) => db.menuItem.update({ where: { id: item.id }, data: { order: item.order, parentId: item.parentId } })));

  await db.activityLog.create({
    data: { userId: session.user.id, action: "menu_item.reorder", entityType: "menu", entityId: menuId, newValue: JSON.stringify({ count: items.length }) },
  });

  return NextResponse.json({ success: true });
}
