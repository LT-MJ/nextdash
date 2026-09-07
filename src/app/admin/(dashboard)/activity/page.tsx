import { requirePermission } from "@/lib/auth/guard";
import { ActivityLogViewer } from "@/components/admin/ActivityLogViewer";

export default async function ActivityPage() {
  await requirePermission("system.activity");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">Audit log of SEO, content, and settings changes across the platform.</p>
      </div>
      <ActivityLogViewer />
    </div>
  );
}
