import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { PageEditorForm } from "@/components/admin/pages/PageEditorForm";

export default async function NewPagePage() {
  const session = await requirePermission("pages.edit");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pages" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to pages
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New page</h1>
        <p className="text-sm text-muted-foreground">SEO settings become available after the first save.</p>
      </div>
      <PageEditorForm page={null} canPublish={session.user.permissions.includes("pages.publish")} />
    </div>
  );
}
