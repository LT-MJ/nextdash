import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { postInputSchema } from "@/lib/blog/validation";
import { calculateReadingTime } from "@/lib/blog/reading-time";

export async function POST(request: Request) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = postInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (data.status === "PUBLISHED" && !session.user.permissions.includes("blog.publish")) {
    return NextResponse.json({ error: "You do not have permission to publish posts." }, { status: 403 });
  }

  const existing = await db.blogPost.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: `A post with slug "${data.slug}" already exists.` }, { status: 409 });
  }

  const now = new Date();
  const publishedAt = data.status === "PUBLISHED" ? new Date(data.publishedAt || now) : data.publishedAt ? new Date(data.publishedAt) : null;

  const created = await db.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content ?? "",
      featuredImage: data.featuredImage || null,
      gallery: JSON.stringify(data.gallery ?? []),
      authorId: data.authorId || null,
      categoryId: data.categoryId || null,
      status: data.status,
      visibility: data.visibility,
      publishedAt,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      commentsEnabled: data.commentsEnabled,
      featured: data.featured,
      readingTimeMinutes: calculateReadingTime(data.content ?? ""),
      tags: { create: (data.tagIds ?? []).map((tagId) => ({ tagId })) },
    },
  });

  await db.activityLog.create({
    data: { userId: session.user.id, action: "blog.post.create", entityType: "post", entityId: created.id, newValue: JSON.stringify({ title: created.title, status: created.status }) },
  });

  return NextResponse.json({ post: created }, { status: 201 });
}
