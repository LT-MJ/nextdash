import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "system.media")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const assets = await db.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "system.media")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 8MB limit." }, { status: 400 });
  }

  const alt = (formData?.get("alt") as string) ?? "";
  const extension = path.extname(file.name) || `.${file.type.split("/")[1]}`;
  const safeName = `${crypto.randomUUID()}${extension}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, safeName), buffer);

  const asset = await db.mediaAsset.create({
    data: {
      filename: file.name,
      url: `/uploads/${safeName}`,
      mimeType: file.type,
      size: file.size,
      alt: alt || null,
    },
  });

  await db.activityLog.create({ data: { userId: session.user.id, action: "media.upload", entityType: "media", entityId: asset.id } });

  return NextResponse.json({ asset }, { status: 201 });
}
