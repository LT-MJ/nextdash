import { requirePermission } from "@/lib/auth/guard";
import { SitemapSettingsForm } from "@/components/admin/seo/SitemapSettingsForm";

export default async function SitemapSettingsPage() {
  await requirePermission("seo.sitemap");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sitemap</h1>
        <p className="text-sm text-muted-foreground">Control which content types are included in the XML sitemap.</p>
      </div>
      <SitemapSettingsForm />
    </div>
  );
}
