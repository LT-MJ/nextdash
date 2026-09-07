import { requirePermission } from "@/lib/auth/guard";
import { BulkEditor } from "@/components/admin/seo/BulkEditor";

export default async function BulkEditorPage() {
  await requirePermission("seo.edit");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bulk SEO Editor</h1>
        <p className="text-sm text-muted-foreground">
          Apply indexability and sitemap-inclusion changes across many items at once. Title/description edits stay per-item to avoid
          overwriting content in bulk.
        </p>
      </div>
      <BulkEditor />
    </div>
  );
}
