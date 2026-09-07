import { requirePermission } from "@/lib/auth/guard";
import { ReadingSettingsForm } from "@/components/admin/site/ReadingSettingsForm";

export default async function ReadingSettingsPage() {
  await requirePermission("site.settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reading</h1>
        <p className="text-sm text-muted-foreground">Choose what displays as your homepage and blog page.</p>
      </div>
      <ReadingSettingsForm />
    </div>
  );
}
