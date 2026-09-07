import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { menuInputSchema } from "@/lib/menus/validation";

export async function GET() {
  const session = await getAuthorizedSession("menus.view");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const menus = await db.menu.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json({ menus });
}

export async function POST(request: Request) {
  const session = await getAuthorizedSession("menus.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = menuInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const created = await db.menu.create({ data: { name: parsed.data.name } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "menu.create", entityType: "menu", entityId: created.id, newValue: JSON.stringify({ name: created.name }) },
  });

  return NextResponse.json({ menu: created }, { status: 201 });
}
