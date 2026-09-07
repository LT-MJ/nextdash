import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "system.jobs")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const jobs = await db.backgroundJob.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ jobs });
}
