import { resolveSeo } from "../resolver";
import { getSchemaGenerator } from "../schema/generators";
import { getGlobalSeoSettings } from "./settings";
import { renderJsonLdTags } from "../json-ld";
import type { db } from "@/lib/server/db";

type PageRow = Awaited<ReturnType<typeof db.page.findUnique>>;

/**
 * Renders a standalone Page (spec's "Pages" content type) to a full HTML
 * document. This lives outside the normal React render tree — see
 * src/app/[...catchall]/route.ts for why: the IndexNow key-verification
 * file must be servable at a single top-level path segment, which forces
 * page slugs and that file onto the same catch-all Route Handler, and a
 * Route Handler can't render a page.tsx's React tree. `renderToStaticMarkup`
 * is used to reuse the exact same JSON-LD escaping as everywhere else, and
 * the inline <style> block copies globals.css's CSS custom properties so
 * the result matches the rest of the site rather than looking like a
 * separate, unstyled document.
 */
export async function renderPageHtml(page: NonNullable<PageRow>): Promise<string> {
  const [seo, globalSettings] = await Promise.all([
    resolveSeo({
      entityType: "page",
      entityId: page.id,
      path: `/${page.slug}`,
      fallbackTitle: page.title,
    }),
    getGlobalSeoSettings(),
  ]);

  const webPageSchema = getSchemaGenerator("WebPage")!.generate({
    name: seo.title,
    url: seo.canonicalUrl,
    description: seo.description ?? undefined,
  });
  const breadcrumbSchema = getSchemaGenerator("BreadcrumbList")!.generate({
    items: [
      { name: "Home", url: globalSettings.siteUrl.replace(/\/$/, "") },
      { name: page.title, url: seo.canonicalUrl },
    ],
  });
  const jsonLdMarkup = renderJsonLdTags([webPageSchema, breadcrumbSchema]);

  const ogImageTag = seo.ogImage ? `<meta property="og:image" content="${escapeAttr(seo.ogImage)}" />` : "";
  const twitterImageTag = seo.twitterImage ? `<meta name="twitter:image" content="${escapeAttr(seo.twitterImage)}" />` : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(seo.title)}</title>
${seo.description ? `<meta name="description" content="${escapeAttr(seo.description)}" />` : ""}
<link rel="canonical" href="${escapeAttr(seo.canonicalUrl)}" />
<meta name="robots" content="${escapeAttr(seo.robotsDirectives)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeAttr(seo.ogTitle)}" />
${seo.ogDescription ? `<meta property="og:description" content="${escapeAttr(seo.ogDescription)}" />` : ""}
<meta property="og:url" content="${escapeAttr(seo.canonicalUrl)}" />
${ogImageTag}
<meta name="twitter:card" content="${escapeAttr(seo.twitterCard)}" />
<meta name="twitter:title" content="${escapeAttr(seo.twitterTitle)}" />
${seo.twitterDescription ? `<meta name="twitter:description" content="${escapeAttr(seo.twitterDescription)}" />` : ""}
${twitterImageTag}
${jsonLdMarkup}
<style>
  :root {
    --background: 210 20% 98%; --foreground: 222 47% 11%; --primary: 243 75% 59%;
    --primary-foreground: 0 0% 100%; --muted-foreground: 215 16% 47%; --border: 214 20% 88%;
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Inter", ui-sans-serif, system-ui, sans-serif; background: hsl(var(--background)); color: hsl(var(--foreground)); }
  header { border-bottom: 1px solid hsl(var(--border)); padding: 1rem 1.5rem; }
  header a { color: hsl(var(--foreground)); font-weight: 700; text-decoration: none; font-size: 1.125rem; }
  main { max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem; }
  main :is(h1, h2, h3) { line-height: 1.25; }
  main h1 { font-size: 2rem; margin-bottom: 1rem; }
  main p { line-height: 1.7; color: hsl(var(--foreground)); }
  main a { color: hsl(var(--primary)); }
  main img { max-width: 100%; height: auto; border-radius: 0.5rem; }
  footer { text-align: center; padding: 2rem 1.5rem; color: hsl(var(--muted-foreground)); font-size: 0.875rem; }
</style>
</head>
<body>
<header><a href="/">${escapeHtml(globalSettings.siteName)}</a></header>
<main>${page.content}</main>
<footer>© ${new Date().getFullYear()} ${escapeHtml(globalSettings.siteName)}</footer>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
