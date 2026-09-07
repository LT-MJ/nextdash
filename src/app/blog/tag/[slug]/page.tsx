import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { getTagBySlug } from "@/lib/blog/queries";
import { PostCard, type PostCardData } from "../../_components/PostCard";
import { Pagination } from "../../_components/Pagination";
import { Breadcrumbs } from "../../_components/Breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";

const PAGE_SIZE = 12;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

// No SEO content-adapter exists for entityType "tag" — set reasonable
// derived metadata directly rather than adding a new adapter (out of scope).
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return {};
  return {
    title: `${tag.name} — Blog`,
    description: tag.description ?? `Posts tagged "${tag.name}".`,
  };
}

export default async function BlogTagPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const where = { status: "PUBLISHED", visibility: "PUBLIC", tags: { some: { tagId: tag.id } } };

  const [total, posts] = await Promise.all([
    db.blogPost.count({ where }),
    db.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: { select: { name: true, slug: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const cards: PostCardData[] = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    readingTimeMinutes: post.readingTimeMinutes,
    categoryName: post.category?.name ?? null,
    categorySlug: post.category?.slug ?? null,
  }));

  return (
    <>
      <div className="space-y-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: `#${tag.name}` }]} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">#{tag.name}</h1>
          {tag.description ? <p className="mt-2 text-muted-foreground">{tag.description}</p> : null}
        </div>
        {cards.length === 0 ? (
          <EmptyState title="No posts with this tag yet." />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <PostCard key={card.slug} post={card} />
            ))}
          </div>
        )}
        <Pagination basePath={`/blog/tag/${tag.slug}`} page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
