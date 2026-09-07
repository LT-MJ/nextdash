"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SeoEditorPanel } from "@/components/seo/SeoEditorPanel";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { BlockEditor } from "@/components/admin/pages/blocks/BlockEditor";
import { slugify } from "@/lib/utils";
import { PAGE_STATUSES, type ContentFormat } from "@/lib/pages/validation";
import type { Block } from "@/lib/pages/blocks/types";

export interface PageEditorInitial {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentFormat: string;
  blocks: string | null;
  status: string;
}

function parseInitialBlocks(raw: string | null | undefined): Block[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Block[]) : [];
  } catch {
    return [];
  }
}

interface PageEditorFormProps {
  page: PageEditorInitial | null;
  canPublish: boolean;
}

export function PageEditorForm({ page, canPublish }: PageEditorFormProps) {
  const router = useRouter();
  const isNew = !page;

  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!page);
  const [content, setContent] = useState(page?.content ?? "");
  const [contentFormat, setContentFormat] = useState<ContentFormat>((page?.contentFormat as ContentFormat) ?? "blocks");
  const [blocks, setBlocks] = useState<Block[]>(() => parseInitialBlocks(page?.blocks));
  const [status, setStatus] = useState(page?.status ?? "DRAFT");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [redirectPrompt, setRedirectPrompt] = useState<{ oldSlug: string; newSlug: string } | null>(null);
  const [redirectStatus, setRedirectStatus] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    const payload = { title, slug, content, contentFormat, blocks: contentFormat === "blocks" ? blocks : undefined, status };
    const url = isNew ? "/api/admin/pages" : `/api/admin/pages/${page.id}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(body.error ?? "Failed to save page.");
      return;
    }

    if (isNew) {
      router.push(`/admin/pages/${body.page.id}`);
      return;
    }

    setSaveMessage("Saved.");
    if (page.status === "PUBLISHED" && slug !== page.slug) {
      setRedirectPrompt({ oldSlug: page.slug, newSlug: slug });
    }
    router.refresh();
  }

  async function handleCreateRedirect() {
    if (!redirectPrompt) return;
    setRedirectStatus(null);
    const res = await fetch("/api/admin/seo/redirects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: `/${redirectPrompt.oldSlug}`, destination: `/${redirectPrompt.newSlug}`, statusCode: 301 }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setRedirectStatus(body.error ?? "Failed to create redirect.");
      return;
    }
    setRedirectPrompt(null);
  }

  async function handleDelete() {
    if (!page) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/pages/${page.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to delete page.");
      return;
    }
    router.push("/admin/pages");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          {page ? <TabsTrigger value="seo">SEO</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Page title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">/{slug || "…"}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
              >
                {PAGE_STATUSES.map((s) => (
                  <option key={s} value={s} disabled={s === "PUBLISHED" && !canPublish}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Content</Label>
                {contentFormat === "html" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBlocks([{ id: crypto.randomUUID(), type: "customHtml", data: { html: content } }]);
                      setContentFormat("blocks");
                    }}
                  >
                    Switch to block editor
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setContentFormat("html")}>
                    Switch to HTML editor
                  </Button>
                )}
              </div>
              {contentFormat === "blocks" ? (
                <BlockEditor value={blocks} onChange={setBlocks} />
              ) : (
                <ContentEditor value={content} onChange={setContent} />
              )}
            </div>
          </div>
        </TabsContent>

        {page ? (
          <TabsContent value="seo">
            <SeoEditorPanel entityType="page" entityId={page.id} />
          </TabsContent>
        ) : null}
      </Tabs>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button onClick={handleSave} disabled={saving || !title || !slug}>
          {saving ? "Saving…" : isNew ? "Create page" : "Save changes"}
        </Button>
        {saveMessage ? <span className="text-sm text-muted-foreground">{saveMessage}</span> : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
        {page ? (
          <Button variant="ghost" className="ml-auto text-destructive hover:text-destructive" onClick={() => setConfirmingDelete(true)}>
            Delete page
          </Button>
        ) : null}
      </div>

      <Dialog open={!!redirectPrompt} onOpenChange={(open) => !open && setRedirectPrompt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redirect the old URL?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This published page&apos;s slug changed from <code className="rounded bg-muted px-1">/{redirectPrompt?.oldSlug}</code> to{" "}
            <code className="rounded bg-muted px-1">/{redirectPrompt?.newSlug}</code>. Create a 301 redirect so existing links and search
            rankings aren&apos;t lost?
          </p>
          {redirectStatus ? <p className="text-sm text-destructive">{redirectStatus}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedirectPrompt(null)}>
              Skip
            </Button>
            <Button onClick={handleCreateRedirect}>Create redirect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this page?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This permanently deletes &ldquo;{page?.title}&rdquo; and its SEO settings. This cannot be undone. Visitors to{" "}
            <code className="rounded bg-muted px-1">/{page?.slug}</code> will see a 404 unless you create a redirect first.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
