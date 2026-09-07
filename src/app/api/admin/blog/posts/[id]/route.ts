import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { postInputSchema } from "@/lib/blog/validation";
import { calculateReadingTime } from "@/lib/blog/reading-time";
import { buildSnapshot, diffChangedFields, createRevision, type PostSnapshot } from "@/lib/blog/revisions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = postInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await db.blogPost.findUnique({ where: { id }, include: { tags: { select: { tagId: true } } } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only a genuine transition into PUBLISHED requires blog.publish — saving
  // an already-published post (with status left unchanged) is an ordinary edit.
  if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED" && !session.user.permissions.includes("blog.publish")) {
    return NextResponse.json({ error: "You do not have permission to publish posts." }, { status: 403 });
  }

  if (data.slug !== existing.slug) {
    const slugTaken = await db.blogPost.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (slugTaken) return NextResponse.json({ error: `A post with slug "${data.slug}" already exists.` }, { status: 409 });
  }

  const publishedAt =
    data.status === "PUBLISHED"
      ? existing.publishedAt ?? new Date(data.publishedAt || Date.now())
      : data.publishedAt
        ? new Date(data.publishedAt)
        : null;

  const beforeSnapshot = buildSnapshot(existing);
  const afterSnapshot: PostSnapshot = {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt || null,
    content: data.content ?? "",
    featuredImage: data.featuredImage || null,
    gallery: data.gallery ?? [],
    authorId: data.authorId || null,
    categoryId: data.categoryId || null,
    tagIds: data.tagIds ?? [],
    status: data.status,
    visibility: data.visibility,
    publishedAt: publishedAt ? publishedAt.toISOString() : null,
    scheduledAt: data.scheduledAt || null,
    commentsEnabled: data.commentsEnabled,
    featured: data.featured,
    readingTimeMinutes: calculateReadingTime(data.content ?? ""),
  };
  const changedFields = diffChangedFields(beforeSnapshot, afterSnapshot);

  // Snapshot the pre-update state BEFORE writing the new values, so a
  // revision always represents a state the post can be rolled back to.
  await createRevision(id, session.user.id, beforeSnapshot, changedFields);

  const updated = await db.blogPost.update({
    where: { id },
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
      tags: { deleteMany: {}, create: (data.tagIds ?? []).map((tagId) => ({ tagId })) },
    },
  });

  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "blog.post.update",
      entityType: "post",
      entityId: updated.id,
      field: changedFields.join(","),
      newValue: JSON.stringify({ title: updated.title, status: updated.status }),
    },
  });

  return NextResponse.json({ post: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const existing = await db.blogPost.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.blogPost.delete({ where: { id } });
  await db.activityLog.create({
    data: { userId: session.user.id, action: "blog.post.delete", entityType: "post", entityId: id, oldValue: JSON.stringify({ title: existing.title }) },
  });

  return NextResponse.json({ success: true });
}
