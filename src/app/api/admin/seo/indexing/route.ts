import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/server/db";
import { enqueueIndexingUrls, processIndexingQueue, getIndexNowKey } from "@/lib/seo/indexnow";

export async function GET() {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.indexing")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const items = await db.indexingQueueItem.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ items, configured: Boolean(getIndexNowKey()) });
}

const submitSchema = z.object({ urls: z.array(z.string().url()).min(1).max(100) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.permissions, "seo.indexing")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = submitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  await enqueueIndexingUrls(parsed.data.urls);
  const result = await processIndexingQueue();
  return NextResponse.json({ success: true, ...result });
}
