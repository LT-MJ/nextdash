import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { bulkStatusSchema } from "@/lib/blog/validation";

export async function PATCH(request: Request) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = bulkStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { ids, status } = parsed.data;

  if (status === "PUBLISHED" && !session.user.permissions.includes("blog.publish")) {
    return NextResponse.json({ error: "You do not have permission to publish posts." }, { status: 403 });
  }

  const posts = await db.blogPost.findMany({ where: { id: { in: ids } }, select: { id: true, publishedAt: true } });
  const now = new Date();

  await db.$transaction(
    posts.map((p) =>
      db.blogPost.update({
        where: { id: p.id },
        data: {
          status,
          ...(status === "PUBLISHED" && !p.publishedAt ? { publishedAt: now } : {}),
        },
      })
    )
  );

  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "blog.post.bulk_status_change",
      entityType: "post",
      newValue: JSON.stringify({ ids: posts.map((p) => p.id), status }),
    },
  });

  return NextResponse.json({ success: true, updated: posts.length });
}
