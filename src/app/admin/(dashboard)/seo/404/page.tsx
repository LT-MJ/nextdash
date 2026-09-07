import { requirePermission } from "@/lib/auth/guard";
import { NotFoundMonitor } from "@/components/admin/seo/NotFoundMonitor";

export default async function NotFoundMonitorPage() {
  await requirePermission("seo.redirects");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">404 Monitor</h1>
        <p className="text-sm text-muted-foreground">Requests to unknown URLs, ranked by frequency. Turn recurring ones into redirects.</p>
      </div>
      <NotFoundMonitor />
    </div>
  );
}
