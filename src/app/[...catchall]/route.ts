import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { renderSitemapChunkXml, getSitemapSourceKeys } from "@/lib/seo/sitemap";
import { getIndexNowKey } from "@/lib/seo/indexnow";
import { findMatchingRedirect, recordRedirectHit } from "@/lib/seo/services/redirects";
import { logNotFound, renderNotFoundHtml } from "@/lib/seo/services/not-found";
import { renderPageHtml } from "@/lib/seo/services/page-renderer";

/**
 * Catches every request that doesn't match a real page/route. This is the
 * Node.js-runtime home for anything needing Prisma that can't run in
 * (Edge) middleware: chunked sitemap files (dynamic filenames App Router
 * can't express as a single route segment), the IndexNow key-verification
 * file, standalone CMS Pages (also forced here — Pages want clean
 * top-level slugs, which live at the same single-segment position as the
 * IndexNow key file, so both must be resolved by the same route to avoid
 * Next.js's "inconsistent dynamic segment name" build error), redirect
 * resolution with full 301/302/303/307/308 control, and 404 logging.
 * Order matters: cheap pattern matches first, then the Page lookup
 * (real published content wins over a stale redirect at the same path),
 * then redirects, then a logged 404.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ catchall: string[] }> }) {
  const { catchall } = await params;
  const path = `/${catchall.join("/")}`;
  const lastSegment = catchall[catchall.length - 1] ?? "";

  if (catchall.length === 1) {
    const sitemapMatch = lastSegment.match(/^sitemap-([a-z_]+)-(\d+)\.xml$/);
    if (sitemapMatch) {
      const [, type, chunkStr] = sitemapMatch;
      if (getSitemapSourceKeys().includes(type)) {
        const xml = await renderSitemapChunkXml(type, Number(chunkStr) - 1);
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" } });
      }
    }

    const indexNowKey = getIndexNowKey();
    if (indexNowKey && lastSegment === `${indexNowKey}.txt`) {
      return new Response(indexNowKey, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    const page = await db.page.findUnique({ where: { slug: lastSegment } });
    if (page && page.status === "PUBLISHED") {
      const html = await renderPageHtml(page);
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
  }

  const redirect = await findMatchingRedirect(path);
  if (redirect) {
    await recordRedirectHit(redirect.id);
    return NextResponse.redirect(new URL(redirect.destination, request.url), redirect.statusCode);
  }

  await logNotFound(path, request.headers.get("referer"), request.headers.get("user-agent"));
  return new Response(renderNotFoundHtml(path), { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
