import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";
import { calculateReadingTime } from "@/lib/blog/reading-time";
import { buildSnapshot, diffChangedFields, createRevision, type PostSnapshot } from "@/lib/blog/revisions";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
  const session = await getAuthorizedSession("blog.edit");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, revisionId } = await params;

  const [post, revision] = await Promise.all([
    db.blogPost.findUnique({ where: { id }, include: { tags: { select: { tagId: true } } } }),
    db.blogPostRevision.findUnique({ where: { id: revisionId } }),
  ]);
  if (!post || !revision || revision.postId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const restored = JSON.parse(revision.snapshot) as PostSnapshot;

  if (restored.status === "PUBLISHED" && !session.user.permissions.includes("blog.publish")) {
    return NextResponse.json({ error: "You do not have permission to publish posts." }, { status: 403 });
  }

  // Snapshot the current (pre-restore) state as its own revision first, so
  // restoring is itself reversible and nothing is silently discarded.
  const currentSnapshot = buildSnapshot(post);
  const changedFields = diffChangedFields(currentSnapshot, restored);
  await createRevision(id, session.user.id, currentSnapshot, changedFields);

  const readingTimeMinutes = calculateReadingTime(restored.content ?? "");

  const updated = await db.blogPost.update({
    where: { id },
    data: {
      title: restored.title,
      slug: restored.slug,
      excerpt: restored.excerpt,
      content: restored.content,
      featuredImage: restored.featuredImage,
      gallery: JSON.stringify(restored.gallery ?? []),
      authorId: restored.authorId,
      categoryId: restored.categoryId,
      status: restored.status,
      visibility: restored.visibility,
      publishedAt: restored.publishedAt ? new Date(restored.publishedAt) : null,
      scheduledAt: restored.scheduledAt ? new Date(restored.scheduledAt) : null,
      commentsEnabled: restored.commentsEnabled,
      featured: restored.featured,
      readingTimeMinutes,
      tags: { deleteMany: {}, create: (restored.tagIds ?? []).map((tagId) => ({ tagId })) },
    },
  });

  await db.activityLog.create({
    data: {
      userId: session.user.id,
      action: "blog.post.restore",
      entityType: "post",
      entityId: id,
      field: "revision",
      oldValue: revisionId,
    },
  });

  return NextResponse.json({ post: updated });
}
