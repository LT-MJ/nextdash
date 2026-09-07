import { requirePermission } from "@/lib/auth/guard";
import { HeaderFooterSettingsForm } from "@/components/admin/site/HeaderFooterSettingsForm";

export default async function HeaderFooterSettingsPage() {
  await requirePermission("site.settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Header &amp; Footer</h1>
        <p className="text-sm text-muted-foreground">Customize your site&apos;s logo, navigation, footer columns, and social links.</p>
      </div>
      <HeaderFooterSettingsForm />
    </div>
  );
}
