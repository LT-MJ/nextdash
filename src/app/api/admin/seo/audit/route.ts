import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { runSiteAudit } from "@/lib/seo/services/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.audit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const runs = await db.seoAuditRun.findMany({ orderBy: { startedAt: "desc" }, take: 20 });
  return NextResponse.json({ runs });
}

export async function POST() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.audit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const runId = await runSiteAudit(session.user.id);
  return NextResponse.json({ runId });
}
