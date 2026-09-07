import Link from "next/link";
import type { Metadata } from "next";
import { resolvePageMetadata, resolveSeo } from "@/lib/seo/resolver";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSchemaGenerator } from "@/lib/seo/schema/generators";
import { getGlobalSeoSettings } from "@/lib/seo/services/settings";

export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata({
    entityType: "homepage",
    entityId: "homepage",
    path: "/",
    fallbackTitle: "Nextdash — Unified SEO, Blog & Commerce Platform",
    fallbackDescription: "Manage SEO, blog content, and your online store from one premium Next.js admin platform.",
  });
}

export default async function HomePage() {
  const [seo, globalSettings] = await Promise.all([
    resolveSeo({
      entityType: "homepage",
      entityId: "homepage",
      path: "/",
      fallbackTitle: "Nextdash — Unified SEO, Blog & Commerce Platform",
      fallbackDescription: "Manage SEO, blog content, and your online store from one premium Next.js admin platform.",
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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <JsonLd data={[orgSchema, websiteSchema]} />
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
    </main>
  );
}
