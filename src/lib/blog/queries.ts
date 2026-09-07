import { cache } from "react";
import { db } from "@/lib/server/db";

/**
 * Read helpers shared by the public blog pages. Wrapped in React `cache()`
 * so `generateMetadata()` and the page component (which both need the same
 * row) share one Prisma round-trip per request instead of two.
 */

export const getPostBySlug = cache(async (slug: string) => {
  return db.blogPost.findUnique({
    where: { slug },
    include: {
      author: true,
      category: true,
      tags: { include: { tag: true } },
    },
  });
});

export const getCategoryBySlug = cache(async (slug: string) => {
  return db.blogCategory.findUnique({ where: { slug } });
});

export const getTagBySlug = cache(async (slug: string) => {
  return db.blogTag.findUnique({ where: { slug } });
});

export const getAuthorBySlug = cache(async (slug: string) => {
  return db.blogAuthor.findUnique({ where: { slug } });
});

/** True if `post` should be visible to an anonymous visitor. */
export function isPubliclyVisible(post: { status: string; visibility: string } | null | undefined): boolean {
  return !!post && post.status === "PUBLISHED" && post.visibility === "PUBLIC";
}

/** Fire-and-forget view count increment — never blocks or throws into the render. */
export function bumpViewCount(postId: string): void {
  void db.blogPost.update({ where: { id: postId }, data: { viewCount: { increment: 1 } } }).catch(() => {});
}
