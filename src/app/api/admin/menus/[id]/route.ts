import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { menuInputSchema } from "@/lib/menus/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("menus.view");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const menu = await db.menu.findUnique({ where: { id }, include: { items: { orderBy: { order: "asc" } } } });
  if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ menu });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("menus.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = menuInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.menu.findUnique({ where: { id }, select: { name: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.menu.update({ where: { id }, data: { name: parsed.data.name } });
  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "menu.update",
      entityType: "menu",
      entityId: id,
      oldValue: JSON.stringify({ name: existing.name }),
      newValue: JSON.stringify({ name: updated.name }),
    },
  });

  return NextResponse.json({ menu: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("menus.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await db.menu.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const usedAsPrimary = await db.headerFooterSettings.findFirst({ where: { primaryMenuId: id }, select: { id: true } });
  if (usedAsPrimary) {
    return NextResponse.json({ error: "This menu is set as the site's primary navigation menu. Change that first in Header & Footer settings." }, { status: 409 });
  }

  const headerFooter = await db.headerFooterSettings.findUnique({ where: { id: "default" }, select: { footerColumns: true } });
  const footerColumns: { menuId?: string }[] = headerFooter?.footerColumns ? JSON.parse(headerFooter.footerColumns) : [];
  if (footerColumns.some((c) => c.menuId === id)) {
    return NextResponse.json({ error: "This menu is used in a footer column. Remove it there first." }, { status: 409 });
  }

  await db.menu.delete({ where: { id } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "menu.delete", entityType: "menu", entityId: id, oldValue: JSON.stringify({ name: existing.name }) },
  });

  return NextResponse.json({ success: true });
}
