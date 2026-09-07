import { resolveSeo } from "../resolver";
import { getSchemaGenerator } from "../schema/generators";
import { getGlobalSeoSettings } from "./settings";
import { renderJsonLdTags } from "../json-ld";
import { escapeHtml, escapeAttr } from "@/lib/html/escape";
import { parseBlocks } from "@/lib/pages/blocks/schema";
import { renderBlocksToHtml } from "@/lib/pages/blocks/render";
import { resolveSiteChrome, renderHeaderHtml, renderFooterHtml } from "@/lib/site/chrome-render";
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
  const [seo, globalSettings, chrome] = await Promise.all([
    resolveSeo({
      entityType: "page",
      entityId: page.id,
      path: `/${page.slug}`,
      fallbackTitle: page.title,
    }),
    getGlobalSeoSettings(),
    resolveSiteChrome(),
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

  const bodyHtml = page.contentFormat === "blocks" ? renderBlocksToHtml(parseBlocks(page.blocks)) : page.content;

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
  .chrome-header { border-bottom: 1px solid hsl(var(--border)); padding: 1rem 1.5rem; display: flex; }
  .chrome-header--sticky { position: sticky; top: 0; z-index: 40; background: hsl(var(--background)); }
  .chrome-header--logo-left-nav-right { flex-direction: row; align-items: center; justify-content: space-between; }
  .chrome-header--centered { flex-direction: row; align-items: center; justify-content: center; gap: 2rem; }
  .chrome-header--logo-center-nav-below { flex-direction: column; align-items: center; gap: 0.5rem; }
  .chrome-logo, .chrome-logo:hover { color: hsl(var(--foreground)); font-weight: 700; text-decoration: none; font-size: 1.125rem; }
  .chrome-logo-image { height: 2rem; width: auto; }
  .chrome-nav ul { display: flex; gap: 1.5rem; list-style: none; margin: 0; padding: 0; }
  .chrome-nav a { color: hsl(var(--muted-foreground)); text-decoration: none; font-size: 0.875rem; font-weight: 500; }
  .chrome-nav a:hover { color: hsl(var(--foreground)); }
  .chrome-submenu { list-style: none; margin: 0.25rem 0 0 0; padding: 0 0 0 1rem; }
  .chrome-footer { border-top: 1px solid hsl(var(--border)); padding: 2.5rem 1.5rem; }
  .chrome-footer-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); gap: 2rem; max-width: 64rem; margin: 0 auto 2rem; }
  .chrome-footer-column h3 { font-size: 0.875rem; font-weight: 600; margin: 0 0 0.5rem; }
  .chrome-footer-column ul { list-style: none; margin: 0; padding: 0; }
  .chrome-footer-column a { color: hsl(var(--muted-foreground)); text-decoration: none; font-size: 0.875rem; line-height: 1.8; }
  .chrome-footer-column a:hover { color: hsl(var(--foreground)); }
  .chrome-social { display: flex; justify-content: center; gap: 1rem; margin-bottom: 1rem; }
  .chrome-social a { color: hsl(var(--muted-foreground)); text-decoration: none; font-size: 0.875rem; }
  .chrome-copyright { text-align: center; color: hsl(var(--muted-foreground)); font-size: 0.875rem; margin: 0; }
  main { max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem; }
  main :is(h1, h2, h3) { line-height: 1.25; }
  main h1 { font-size: 2rem; margin-bottom: 1rem; }
  main p { line-height: 1.7; color: hsl(var(--foreground)); }
  main a { color: hsl(var(--primary)); }
  main img { max-width: 100%; height: auto; border-radius: 0.5rem; }
  main .blocks-columns { display: grid; gap: 1.5rem; margin: 1.5rem 0; }
  main .blocks-columns[data-columns="2"] { grid-template-columns: repeat(2, 1fr); }
  main .blocks-columns[data-columns="3"] { grid-template-columns: repeat(3, 1fr); }
  main .blocks-button { display: inline-block; padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; }
  main .blocks-button--primary { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
  main .blocks-button--secondary { background: hsl(var(--border)); color: hsl(var(--foreground)); }
  main .blocks-button--outline { border: 1px solid hsl(var(--border)); color: hsl(var(--foreground)); }
  main .blocks-quote { border-left: 3px solid hsl(var(--primary)); margin: 1.5rem 0; padding: 0.25rem 0 0.25rem 1rem; font-style: italic; color: hsl(var(--muted-foreground)); }
  main hr.blocks-divider { border: none; border-top: 1px solid hsl(var(--border)); margin: 2rem 0; }
</style>
</head>
<body>
${renderHeaderHtml(chrome)}
<main>${bodyHtml}</main>
${renderFooterHtml(chrome)}
</body>
</html>`;
}
