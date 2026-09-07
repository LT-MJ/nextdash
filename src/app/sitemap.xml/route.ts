import { renderSitemapIndexXml } from "@/lib/seo/sitemap";

export async function GET() {
  const xml = await renderSitemapIndexXml();
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=1800" },
  });
}
