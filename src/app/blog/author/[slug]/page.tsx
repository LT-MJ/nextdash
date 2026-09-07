import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { getAuthorBySlug } from "@/lib/blog/queries";
import { resolvePageMetadata } from "@/lib/seo/resolver";
import { getSchemaGenerator } from "@/lib/seo/schema/generators";
import { getGlobalSeoSettings } from "@/lib/seo/services/settings";
import { JsonLd } from "@/components/seo/JsonLd";
import { PostCard, type PostCardData } from "../../_components/PostCard";
import { Pagination } from "../../_components/Pagination";
import { Breadcrumbs } from "../../_components/Breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";

const PAGE_SIZE = 12;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return {};
  return resolvePageMetadata({
    entityType: "author",
    entityId: author.id,
    path: `/blog/author/${author.slug}`,
    fallbackTitle: author.name,
    fallbackDescription: author.bio,
    fallbackImage: author.profileImage,
  });
}

export default async function BlogAuthorPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const where = { status: "PUBLISHED", visibility: "PUBLIC", authorId: author.id };

  const [globalSettings, total, posts] = await Promise.all([
    getGlobalSeoSettings(),
    db.blogPost.count({ where }),
    db.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: { select: { name: true, slug: true } } },
    }),
  ]);

  const siteUrl = globalSettings.siteUrl.replace(/\/$/, "");
  const socialProfiles: string[] = JSON.parse(author.socialProfiles ?? "[]");
  const personSchema = getSchemaGenerator("Person")!.generate({
    name: author.name,
    url: `${siteUrl}/blog/author/${author.slug}`,
    image: author.profileImage,
    description: author.bio,
    sameAs: socialProfiles,
  });

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
      <JsonLd data={personSchema} />
      <div className="space-y-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: author.name }]} />
        <div className="flex items-center gap-4">
          {author.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={author.profileImage} alt={author.name} className="h-20 w-20 rounded-full object-cover" />
          ) : null}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{author.name}</h1>
            {author.bio ? <p className="mt-1 max-w-xl text-muted-foreground">{author.bio}</p> : null}
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {author.website ? (
                <a href={author.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Website
                </a>
              ) : null}
              {socialProfiles.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {hostnameOf(url)}
                </a>
              ))}
            </div>
          </div>
        </div>
        {cards.length === 0 ? (
          <EmptyState title="No posts by this author yet." />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <PostCard key={card.slug} post={card} />
            ))}
          </div>
        )}
        <Pagination basePath={`/blog/author/${author.slug}`} page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
