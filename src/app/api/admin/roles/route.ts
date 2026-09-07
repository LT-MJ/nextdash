import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "system.users")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const roles = await db.role.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({
    roles: roles.map((r) => ({ id: r.id, key: r.key, name: r.name, description: r.description, permissions: JSON.parse(r.permissions) as string[], isSystem: r.isSystem })),
  });
}
