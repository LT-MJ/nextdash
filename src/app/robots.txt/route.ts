import { getRobotsTxtSettings, getGlobalSeoSettings } from "@/lib/seo/services/settings";

export async function GET() {
  const [settings, globalSettings] = await Promise.all([getRobotsTxtSettings(), getGlobalSeoSettings()]);
  const siteUrl = globalSettings.siteUrl.replace(/\/$/, "");
  const hasSitemapLine = /sitemap:/i.test(settings.content);
  const body = hasSitemapLine ? settings.content : `${settings.content.trimEnd()}\nSitemap: ${siteUrl}/sitemap.xml\n`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
