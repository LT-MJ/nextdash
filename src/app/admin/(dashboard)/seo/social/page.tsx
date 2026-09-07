import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { getGlobalSeoSettings } from "@/lib/seo/services/settings";
import { SocialPreview } from "@/components/seo/SocialPreview";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function SocialSeoPage() {
  await requirePermission("seo.settings");
  const settings = await getGlobalSeoSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Social</h1>
        <p className="text-sm text-muted-foreground">
          Site-wide social defaults. Per-page Open Graph and Twitter/X overrides are set on that page&apos;s{" "}
          <Link href="/admin/seo/content" className="text-primary underline">SEO editor</Link>, Social tab.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default social image</CardTitle>
          <CardDescription>Used whenever a page doesn&apos;t set its own Open Graph / Twitter image.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <SocialPreview title={settings.siteName} description={settings.orgDescription} image={settings.defaultSocialImage} siteName={settings.siteName} variant="facebook" />
          <SocialPreview title={settings.siteName} description={settings.orgDescription} image={settings.defaultSocialImage} siteName={settings.siteName} variant="twitter" />
        </CardContent>
      </Card>
      <p className="text-sm">
        Edit the default image and organization description in <Link href="/admin/seo/settings" className="text-primary underline">Global SEO Settings</Link>.
      </p>
    </div>
  );
}
