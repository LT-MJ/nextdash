import { requirePermission } from "@/lib/auth/guard";
import { IndexingQueue } from "@/components/admin/seo/IndexingQueue";

export default async function IndexingPage() {
  await requirePermission("seo.indexing");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Indexing</h1>
        <p className="text-sm text-muted-foreground">
          Submit changed URLs to IndexNow-compatible search engines. Submission speeds up discovery — it does not guarantee indexing.
        </p>
      </div>
      <IndexingQueue />
    </div>
  );
}
