import Link from "next/link";
import { requirePermission } from "@/lib/auth/guard";
import { AuditRunner } from "@/components/admin/seo/AuditRunner";

export default async function SeoAuditPage() {
  await requirePermission("seo.audit");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Site Audit</h1>
        <p className="text-sm text-muted-foreground">
          Summarizes failed rule checks from previously analyzed content, plus duplicate metadata and orphan-page detection.
          Content that has never been opened in the SEO editor won&apos;t have a stored analysis yet — visit{" "}
          <Link className="text-primary underline" href="/admin/seo/content">Content SEO</Link> to analyze it.
        </p>
      </div>
      <AuditRunner />
    </div>
  );
}
