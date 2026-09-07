import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "system.media")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (asset.url.startsWith("/uploads/")) {
    await unlink(path.join(process.cwd(), "public", asset.url)).catch(() => {
      // File already missing on disk — proceed with removing the DB record regardless.
    });
  }
  await db.mediaAsset.delete({ where: { id } });
  await db.activityLog.create({ data: { userId: session.user.id, action: "media.delete", entityType: "media", entityId: id } });
  return NextResponse.json({ success: true });
}
