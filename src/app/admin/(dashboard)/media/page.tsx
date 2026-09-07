import { requirePermission } from "@/lib/auth/guard";
import { MediaLibrary } from "@/components/admin/MediaLibrary";

export default async function MediaPage() {
  await requirePermission("system.media");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Media</h1>
        <p className="text-sm text-muted-foreground">
          Shared media library used across blog posts and products. Files are stored on local disk under{" "}
          <code className="rounded bg-muted px-1">public/uploads</code> — for a serverless deployment, point this at object storage
          (S3-compatible) instead, since serverless filesystems are ephemeral.
        </p>
      </div>
      <MediaLibrary />
    </div>
  );
}
