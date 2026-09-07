import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { db } from "@/lib/server/db";
import { getReadingSettings } from "@/lib/site/settings";
import { PageContent } from "@/components/content/PageContent";
import { PostCard, type PostCardData } from "./_components/PostCard";
import { CategoryChips } from "./_components/CategoryChips";
import { Pagination } from "./_components/Pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DEFAULT_TITLE = "Blog";
const DEFAULT_DESCRIPTION = "Announcements, guides, and updates.";

async function getBlogIntroPage() {
  const reading = await getReadingSettings();
  if (!reading.blogPageId) return null;
  const page = await db.page.findUnique({ where: { id: reading.blogPageId } });
  return page && page.status === "PUBLISHED" ? page : null;
}

// "blog-index" is not a real SEO-adapter-backed entity, so metadata here is
// static (falling back to that) rather than routed through
// resolvePageMetadata (spec item 6) — a Reading Settings blog-page swaps
// just the title, not full SEO resolution.
export async function generateMetadata(): Promise<Metadata> {
  const introPage = await getBlogIntroPage();
  return { title: introPage?.title ?? DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
}

const PAGE_SIZE = 12;

interface SearchParams {
  page?: string;
  search?: string;
}

export default async function BlogIndexPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const search = sp.search?.trim() ?? "";

  const introPage = await getBlogIntroPage();

  const featured =
    page === 1 && !search
      ? await db.blogPost.findFirst({
          where: { status: "PUBLISHED", visibility: "PUBLIC", featured: true },
          orderBy: { publishedAt: "desc" },
        })
      : null;

  const where: Record<string, unknown> = { status: "PUBLISHED", visibility: "PUBLIC" };
  if (search) where.title = { contains: search };
  if (featured) where.id = { not: featured.id };

  const [total, posts, categoriesRaw] = await Promise.all([
    db.blogPost.count({ where }),
    db.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: { select: { name: true, slug: true } } },
    }),
    db.blogCategory.findMany({ take: 20, include: { _count: { select: { posts: true } } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categoryChips = categoriesRaw.filter((c) => c._count.posts > 0).map((c) => ({ slug: c.slug, name: c.name, postCount: c._count.posts }));

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
      <div className="space-y-10">
        <div className="space-y-4 text-center">
          {introPage ? (
            <>
              <h1 className="text-4xl font-bold tracking-tight">{introPage.title}</h1>
              <PageContent
                content={introPage.content}
                contentFormat={introPage.contentFormat}
                blocks={introPage.blocks}
                className="mx-auto max-w-xl text-muted-foreground [&_p]:my-0"
              />
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
              <p className="mx-auto max-w-xl text-muted-foreground">Announcements, guides, and updates.</p>
            </>
          )}
          <form method="get" className="mx-auto flex max-w-md gap-2">
            <Input name="search" defaultValue={search} placeholder="Search posts…" aria-label="Search posts" />
            <Button type="submit" aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <CategoryChips categories={categoryChips} />

        {featured ? (
          <Link href={`/blog/${featured.slug}`} className="block overflow-hidden rounded-xl border border-border bg-card md:flex">
            {featured.featuredImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featured.featuredImage} alt={featured.title} className="h-56 w-full object-cover md:h-auto md:w-1/2" />
            ) : null}
            <div className="flex flex-1 flex-col justify-center gap-3 p-8">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">Featured</span>
              <h2 className="text-2xl font-bold">{featured.title}</h2>
              {featured.excerpt ? <p className="text-muted-foreground">{featured.excerpt}</p> : null}
            </div>
          </Link>
        ) : null}

        {cards.length === 0 ? (
          <EmptyState title="No posts found." description={search ? "Try a different search term." : "Check back soon for new content."} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <PostCard key={card.slug} post={card} />
            ))}
          </div>
        )}

        <Pagination basePath="/blog" page={page} totalPages={totalPages} extraParams={{ search }} />
      </div>
    </>
  );
}
