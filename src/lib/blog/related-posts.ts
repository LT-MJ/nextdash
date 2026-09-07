import { db } from "@/lib/server/db";

export interface RelatedPostSummary {
  id: string;
  title: string;
  slug: string;
  featuredImage: string | null;
  excerpt: string | null;
}

const SUMMARY_SELECT = {
  id: true,
  title: true,
  slug: true,
  featuredImage: true,
  excerpt: true,
  status: true,
} as const;

type RawSummary = {
  id: string;
  title: string;
  slug: string;
  featuredImage: string | null;
  excerpt: string | null;
  status: string;
};

function toSummary(post: RawSummary): RelatedPostSummary {
  return { id: post.id, title: post.title, slug: post.slug, featuredImage: post.featuredImage, excerpt: post.excerpt };
}

/**
 * Related-post suggestion (spec item 8): manual `BlogPostRelation` rows win
 * first, then same-category most-recent-published, then most-recent-published
 * overall — always excluding the source post itself and never returning more
 * than `limit`.
 */
export async function getRelatedPosts(postId: string, limit = 3): Promise<RelatedPostSummary[]> {
  const manualRows = await db.blogPostRelation.findMany({
    where: { sourcePostId: postId },
    include: { relatedPost: { select: SUMMARY_SELECT } },
    take: limit,
  });

  const manual = manualRows.map((r) => r.relatedPost).filter((p): p is RawSummary => p.status === "PUBLISHED");

  if (manual.length >= limit) {
    return manual.slice(0, limit).map(toSummary);
  }

  const excludeIds = [postId, ...manual.map((p) => p.id)];
  const remainingAfterManual = limit - manual.length;

  const post = await db.blogPost.findUnique({ where: { id: postId }, select: { categoryId: true } });

  let sameCategory: RawSummary[] = [];
  if (post?.categoryId) {
    sameCategory = await db.blogPost.findMany({
      where: { categoryId: post.categoryId, status: "PUBLISHED", id: { notIn: excludeIds } },
      orderBy: { publishedAt: "desc" },
      take: remainingAfterManual,
      select: SUMMARY_SELECT,
    });
  }

  const combined = [...manual, ...sameCategory];
  if (combined.length < limit) {
    const stillNeeded = limit - combined.length;
    const excludeMore = [...excludeIds, ...sameCategory.map((p) => p.id)];
    const fallback = await db.blogPost.findMany({
      where: { status: "PUBLISHED", id: { notIn: excludeMore } },
      orderBy: { publishedAt: "desc" },
      take: stillNeeded,
      select: SUMMARY_SELECT,
    });
    return [...combined, ...fallback].slice(0, limit).map(toSummary);
  }

  return combined.slice(0, limit).map(toSummary);
}
