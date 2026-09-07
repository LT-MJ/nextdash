import { requirePermission } from "@/lib/auth/guard";
import { RedirectsManager } from "@/components/admin/seo/RedirectsManager";

export default async function RedirectsPage() {
  await requirePermission("seo.redirects");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Redirects</h1>
        <p className="text-sm text-muted-foreground">Manage 301/302/303/307/308 redirects. Unmatched URLs fall through to the 404 monitor.</p>
      </div>
      <RedirectsManager />
    </div>
  );
}
