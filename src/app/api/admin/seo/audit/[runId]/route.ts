import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.audit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { runId } = await params;
  const run = await db.seoAuditRun.findUnique({
    where: { id: runId },
    include: { issues: { orderBy: { severity: "asc" }, take: 500 } },
  });
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ run });
}
