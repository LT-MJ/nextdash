import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { getPostBySlug, isPubliclyVisible, bumpViewCount } from "@/lib/blog/queries";
import { getRelatedPosts } from "@/lib/blog/related-posts";
import { calculateReadingTime } from "@/lib/blog/reading-time";
import { resolvePageMetadata } from "@/lib/seo/resolver";
import { getGlobalSeoSettings } from "@/lib/seo/services/settings";
import { getSchemaGenerator } from "@/lib/seo/schema/generators";
import { JsonLd } from "@/components/seo/JsonLd";
import { BlogChrome } from "../_components/BlogChrome";
import { PostContent } from "../_components/PostContent";
import { PostCard, type PostCardData } from "../_components/PostCard";
import { Breadcrumbs } from "../_components/Breadcrumbs";
import { ShareLinks } from "../_components/ShareLinks";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function canViewUnpublished(): Promise<boolean> {
  const session = await auth();
  return !!session?.user && hasPermission(session.user.permissions, "blog.view");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || (!isPubliclyVisible(post) && !(await canViewUnpublished()))) return {};

  return resolvePageMetadata({
    entityType: "post",
    entityId: post.id,
    path: `/blog/${post.slug}`,
    fallbackTitle: post.title,
    fallbackDescription: post.excerpt,
    fallbackImage: post.featuredImage,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || (!isPubliclyVisible(post) && !(await canViewUnpublished()))) {
    notFound();
  }

  bumpViewCount(post.id);

  const [related, globalSettings] = await Promise.all([getRelatedPosts(post.id, 3), getGlobalSeoSettings()]);

  const siteUrl = globalSettings.siteUrl.replace(/\/$/, "");
  const canonical = `${siteUrl}/blog/${post.slug}`;
  const readingTime = post.readingTimeMinutes ?? calculateReadingTime(post.content);

  const articleSchema = getSchemaGenerator("Article")!.generate({
    headline: post.title,
    description: post.excerpt,
    url: canonical,
    image: post.featuredImage,
    datePublished: post.publishedAt?.toISOString() ?? null,
    dateModified: post.updatedAt.toISOString(),
    authorName: post.author?.name ?? null,
    publisherName: globalSettings.siteName,
    publisherLogo: globalSettings.orgLogo,
    variant: "BlogPosting",
  });

  const breadcrumbItems = [
    { name: "Home", url: siteUrl },
    { name: "Blog", url: `${siteUrl}/blog` },
    ...(post.category ? [{ name: post.category.name, url: `${siteUrl}/blog/category/${post.category.slug}` }] : []),
    { name: post.title, url: canonical },
  ];
  const breadcrumbSchema = getSchemaGenerator("BreadcrumbList")!.generate({ items: breadcrumbItems });

  const relatedCards: PostCardData[] = related.map((r) => ({
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    featuredImage: r.featuredImage,
    publishedAt: null,
    readingTimeMinutes: null,
    categoryName: null,
    categorySlug: null,
  }));

  return (
    <BlogChrome>
      <JsonLd data={[articleSchema, breadcrumbSchema]} />
      <article className="space-y-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            ...(post.category ? [{ label: post.category.name, href: `/blog/category/${post.category.slug}` }] : []),
            { label: post.title },
          ]}
        />

        <header className="space-y-4">
          {post.category ? (
            <Link href={`/blog/category/${post.category.slug}`} className="text-xs font-semibold uppercase tracking-wide text-primary">
              {post.category.name}
            </Link>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
          {post.excerpt ? <p className="text-lg text-muted-foreground">{post.excerpt}</p> : null}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {post.author ? (
              <Link href={`/blog/author/${post.author.slug}`} className="font-medium text-foreground hover:underline">
                {post.author.name}
              </Link>
            ) : null}
            <span>{formatDate(post.publishedAt)}</span>
            <span>·</span>
            <span>{readingTime} min read</span>
            {post.updatedAt && post.publishedAt && post.updatedAt.getTime() !== post.publishedAt.getTime() ? (
              <span className="text-xs">(updated {formatDate(post.updatedAt)})</span>
            ) : null}
          </div>
        </header>

        {post.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.featuredImage} alt={post.title} className="w-full rounded-xl object-cover" />
        ) : null}

        <PostContent html={post.content} />

        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-6">
            {post.tags.map(({ tag }) => (
              <Link key={tag.id} href={`/blog/tag/${tag.slug}`} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-accent">
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="border-t border-border pt-6">
          <p className="mb-2 text-sm font-medium">Share this post</p>
          <ShareLinks url={canonical} title={post.title} />
        </div>

        {post.author?.bio ? (
          <div className="flex gap-4 rounded-lg border border-border bg-card p-5">
            {post.author.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author.profileImage} alt={post.author.name} className="h-14 w-14 flex-shrink-0 rounded-full object-cover" />
            ) : null}
            <div>
              <Link href={`/blog/author/${post.author.slug}`} className="font-semibold hover:underline">
                {post.author.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{post.author.bio}</p>
            </div>
          </div>
        ) : null}

        {relatedCards.length > 0 ? (
          <div className="border-t border-border pt-6">
            <h2 className="mb-4 text-xl font-bold">Related posts</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {relatedCards.map((card) => (
                <PostCard key={card.slug} post={card} />
              ))}
            </div>
          </div>
        ) : null}
      </article>
    </BlogChrome>
  );
}
