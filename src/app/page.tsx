import Link from "next/link";
import type { Metadata } from "next";
import { resolvePageMetadata, resolveSeo } from "@/lib/seo/resolver";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSchemaGenerator } from "@/lib/seo/schema/generators";
import { getGlobalSeoSettings } from "@/lib/seo/services/settings";
import { getReadingSettings } from "@/lib/site/settings";
import { db } from "@/lib/server/db";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageContent } from "@/components/content/PageContent";

// The homepage now depends on mutable, admin-editable state (Reading
// Settings' homepage assignment, plus the shared header/footer chrome's
// menus and settings) — it can no longer be statically prerendered at
// build time, or a settings change would never show up without a rebuild.
export const dynamic = "force-dynamic";

const FALLBACK_TITLE = "Nextdash — Unified SEO, Blog & Commerce Platform";
const FALLBACK_DESCRIPTION = "Manage SEO, blog content, and your online store from one premium Next.js admin platform.";

async function getHomepagePage() {
  const reading = await getReadingSettings();
  if (reading.homepageMode !== "PAGE" || !reading.homepagePageId) return null;
  const page = await db.page.findUnique({ where: { id: reading.homepagePageId } });
  return page && page.status === "PUBLISHED" ? page : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const homepagePage = await getHomepagePage();
  return resolvePageMetadata({
    entityType: homepagePage ? "page" : "homepage",
    entityId: homepagePage ? homepagePage.id : "homepage",
    path: "/",
    fallbackTitle: homepagePage ? homepagePage.title : FALLBACK_TITLE,
    fallbackDescription: homepagePage ? undefined : FALLBACK_DESCRIPTION,
  });
}

export default async function HomePage() {
  const homepagePage = await getHomepagePage();

  const [seo, globalSettings] = await Promise.all([
    resolveSeo({
      entityType: homepagePage ? "page" : "homepage",
      entityId: homepagePage ? homepagePage.id : "homepage",
      path: "/",
      fallbackTitle: homepagePage ? homepagePage.title : FALLBACK_TITLE,
      fallbackDescription: homepagePage ? undefined : FALLBACK_DESCRIPTION,
    }),
    getGlobalSeoSettings(),
  ]);

  const orgSchema = getSchemaGenerator("Organization")!.generate({
    name: globalSettings.orgName || globalSettings.siteName,
    url: globalSettings.siteUrl,
    logo: globalSettings.orgLogo,
    description: globalSettings.orgDescription,
  });
  const websiteSchema = getSchemaGenerator("WebSite")!.generate({
    name: globalSettings.siteName,
    url: globalSettings.siteUrl,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <JsonLd data={[orgSchema, websiteSchema]} />
        {homepagePage ? (
          <div className="mx-auto max-w-3xl px-6 py-12">
            <h1 className="mb-4 text-3xl font-bold tracking-tight">{homepagePage.title}</h1>
            <PageContent content={homepagePage.content} contentFormat={homepagePage.contentFormat} blocks={homepagePage.blocks} />
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
            <h1 className="text-3xl font-bold tracking-tight">{seo.title}</h1>
            <p className="text-muted-foreground">{seo.description}</p>
            <div className="flex gap-3">
              <Link href="/blog" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Visit the blog
              </Link>
              <Link href="/shop" className="rounded-md border border-input px-4 py-2 text-sm font-medium">
                Visit the shop
              </Link>
              <Link href="/admin" className="rounded-md border border-input px-4 py-2 text-sm font-medium">
                Admin
              </Link>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
