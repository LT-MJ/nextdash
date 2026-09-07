import { requirePermission } from "@/lib/auth/guard";
import { GlobalSeoSettingsForm } from "@/components/admin/seo/GlobalSeoSettingsForm";

export default async function SeoGlobalSettingsPage() {
  await requirePermission("seo.settings");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Global SEO Settings</h1>
        <p className="text-sm text-muted-foreground">Website identity and site-wide defaults used across every content type.</p>
      </div>
      <GlobalSeoSettingsForm />
    </div>
  );
}
