import { requirePermission } from "@/lib/auth/guard";
import { LocalSeoSettingsForm } from "@/components/admin/seo/LocalSeoSettingsForm";

export default async function LocalSeoPage() {
  await requirePermission("seo.settings");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Local SEO</h1>
        <p className="text-sm text-muted-foreground">Business identity used to generate LocalBusiness structured data.</p>
      </div>
      <LocalSeoSettingsForm />
    </div>
  );
}
