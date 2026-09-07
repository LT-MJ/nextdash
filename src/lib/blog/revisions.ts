import { db } from "@/lib/server/db";

/**
 * Fields captured in a BlogPostRevision snapshot. Kept intentionally close to
 * the editable surface of the post editor so a restore can fully roll a post
 * back to a prior state (spec §31 revision history).
 */
export interface PostSnapshot {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  gallery: string[];
  authorId: string | null;
  categoryId: string | null;
  tagIds: string[];
  status: string;
  visibility: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  commentsEnabled: boolean;
  featured: boolean;
  readingTimeMinutes: number | null;
}

type BlogPostWithTags = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  gallery: string | null;
  authorId: string | null;
  categoryId: string | null;
  status: string;
  visibility: string;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  commentsEnabled: boolean;
  featured: boolean;
  readingTimeMinutes: number | null;
  tags: { tagId: string }[];
};

export function buildSnapshot(post: BlogPostWithTags): PostSnapshot {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    featuredImage: post.featuredImage,
    gallery: JSON.parse(post.gallery ?? "[]"),
    authorId: post.authorId,
    categoryId: post.categoryId,
    tagIds: post.tags.map((t) => t.tagId),
    status: post.status,
    visibility: post.visibility,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : null,
    commentsEnabled: post.commentsEnabled,
    featured: post.featured,
    readingTimeMinutes: post.readingTimeMinutes,
  };
}

/** Field-by-field diff between a prior snapshot and the incoming update, for BlogPostRevision.changedFields. */
export function diffChangedFields(before: PostSnapshot, after: Partial<PostSnapshot>): string[] {
  const changed: string[] = [];
  for (const key of Object.keys(after) as (keyof PostSnapshot)[]) {
    const beforeValue = JSON.stringify(before[key]);
    const afterValue = JSON.stringify(after[key]);
    if (beforeValue !== afterValue) changed.push(key);
  }
  return changed;
}

export async function createRevision(postId: string, authorId: string | null, snapshot: PostSnapshot, changedFields: string[]) {
  if (changedFields.length === 0) return null;
  return db.blogPostRevision.create({
    data: {
      postId,
      authorId,
      snapshot: JSON.stringify(snapshot),
      changedFields: JSON.stringify(changedFields),
    },
  });
}
