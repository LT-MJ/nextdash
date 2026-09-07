import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "system.activity")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const action = searchParams.get("action");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = 30;

  const where = {
    ...(entityType ? { entityType } : {}),
    ...(action ? { action: { contains: action } } : {}),
  };

  const [entries, total, entityTypes] = await Promise.all([
    db.activityLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.activityLog.count({ where }),
    db.activityLog.findMany({ distinct: ["entityType"], select: { entityType: true }, take: 50 }),
  ]);

  return NextResponse.json({
    entries,
    total,
    page,
    pageSize,
    entityTypes: entityTypes.map((e) => e.entityType),
  });
}
