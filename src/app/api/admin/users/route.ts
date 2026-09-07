import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "system.users")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await db.user.findMany({
    include: { role: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    users: users.map((u) => ({ id: u.id, name: u.name, email: u.email, isActive: u.isActive, roleId: u.roleId, roleName: u.role.name, createdAt: u.createdAt })),
  });
}

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  roleId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "system.users")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await db.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash, roleId: parsed.data.roleId },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "user.create", entityType: "user", entityId: user.id },
  });

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
}
