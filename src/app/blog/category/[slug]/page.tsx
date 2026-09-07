import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { getCategoryBySlug } from "@/lib/blog/queries";
import { resolvePageMetadata } from "@/lib/seo/resolver";
import { PostCard, type PostCardData } from "../../_components/PostCard";
import { Pagination } from "../../_components/Pagination";
import { Breadcrumbs } from "../../_components/Breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";

const PAGE_SIZE = 12;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return resolvePageMetadata({
    entityType: "category",
    entityId: category.id,
    path: `/blog/category/${category.slug}`,
    fallbackTitle: category.name,
    fallbackDescription: category.description,
  });
}

export default async function BlogCategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const where = { status: "PUBLISHED", visibility: "PUBLIC", categoryId: category.id };

  const [total, posts] = await Promise.all([
    db.blogPost.count({ where }),
    db.blogPost.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const cards: PostCardData[] = posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    readingTimeMinutes: post.readingTimeMinutes,
    categoryName: category.name,
    categorySlug: category.slug,
  }));

  return (
    <>
      <div className="space-y-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: category.name }]} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
          {category.description ? <p className="mt-2 text-muted-foreground">{category.description}</p> : null}
        </div>
        {cards.length === 0 ? (
          <EmptyState title="No posts in this category yet." />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <PostCard key={card.slug} post={card} />
            ))}
          </div>
        )}
        <Pagination basePath={`/blog/category/${category.slug}`} page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
