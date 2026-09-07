import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { getContentAdapter } from "@/lib/seo/content-registry";
import { SeoEditorPanel } from "@/components/seo/SeoEditorPanel";
import type { ContentTypeKey } from "@/types/seo";

export default async function SeoContentEditorPage({
  params,
}: {
  params: Promise<{ entityType: string; entityId: string }>;
}) {
  await requirePermission("seo.edit");
  const { entityType, entityId } = await params;
  const adapter = getContentAdapter(entityType as ContentTypeKey);
  if (!adapter) notFound();
  const exists = await adapter.exists(entityId);
  if (!exists) notFound();

  const title = await adapter.getTitle(entityId);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/seo/content?entityType=${entityType}`} className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to {adapter.label}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">SEO: {title}</h1>
        <p className="text-sm text-muted-foreground">Focus keyword, metadata, social previews, and live analysis.</p>
      </div>
      <SeoEditorPanel entityType={entityType as ContentTypeKey} entityId={entityId} />
    </div>
  );
}
