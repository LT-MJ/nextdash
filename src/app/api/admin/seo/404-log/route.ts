import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.redirects")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const entries = await db.notFoundLog.findMany({
    where: { resolved: false, ignored: false },
    orderBy: { hitCount: "desc" },
    take: 200,
  });
  return NextResponse.json({ entries });
}
