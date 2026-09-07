import { requirePermission } from "@/lib/auth/guard";
import { BreadcrumbSettingsForm } from "@/components/admin/seo/BreadcrumbSettingsForm";

export default async function BreadcrumbsPage() {
  await requirePermission("seo.settings");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Breadcrumbs</h1>
        <p className="text-sm text-muted-foreground">Configure the breadcrumb trail rendered on the public site.</p>
      </div>
      <BreadcrumbSettingsForm />
    </div>
  );
}
