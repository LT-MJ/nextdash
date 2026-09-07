import Link from "next/link";
import { formatDate } from "@/lib/utils";

export interface PostCardData {
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  readingTimeMinutes: number | null;
  categoryName: string | null;
  categorySlug: string | null;
}

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      <Link href={`/blog/${post.slug}`} className="block aspect-[16/9] overflow-hidden bg-muted">
        {post.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-muted-foreground/30">✦</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {post.categoryName && post.categorySlug ? (
          <Link href={`/blog/category/${post.categorySlug}`} className="text-xs font-semibold uppercase tracking-wide text-primary">
            {post.categoryName}
          </Link>
        ) : null}
        <h2 className="text-lg font-semibold leading-snug">
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        {post.excerpt ? <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p> : null}
        <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <span>{formatDate(post.publishedAt)}</span>
          {post.readingTimeMinutes ? (
            <>
              <span>·</span>
              <span>{post.readingTimeMinutes} min read</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
