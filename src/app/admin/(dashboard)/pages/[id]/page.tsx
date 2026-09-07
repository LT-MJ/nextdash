import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/server/db";
import { requirePermission } from "@/lib/auth/guard";
import { PageEditorForm, type PageEditorInitial } from "@/components/admin/pages/PageEditorForm";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("pages.edit");
  const { id } = await params;

  const page = await db.page.findUnique({ where: { id } });
  if (!page) notFound();

  const initialPage: PageEditorInitial = {
    id: page.id,
    title: page.title,
    slug: page.slug,
    content: page.content,
    contentFormat: page.contentFormat,
    blocks: page.blocks,
    status: page.status,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pages" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to pages
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{page.title}</h1>
        <p className="text-sm text-muted-foreground">/{page.slug}</p>
      </div>
      <PageEditorForm page={initialPage} canPublish={session.user.permissions.includes("pages.publish")} />
    </div>
  );
}
