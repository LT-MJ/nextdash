"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SeoEditorPanel } from "@/components/seo/SeoEditorPanel";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { RevisionsPanel } from "@/components/admin/blog/RevisionsPanel";
import { slugify } from "@/lib/utils";
import { calculateReadingTime } from "@/lib/blog/reading-time";
import { POST_STATUSES } from "@/lib/blog/validation";

export interface PostEditorInitial {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  gallery: string[];
  authorId: string | null;
  categoryId: string | null;
  tagIds: string[];
  status: string;
  visibility: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  commentsEnabled: boolean;
  featured: boolean;
  viewCount: number;
}

export interface Option {
  id: string;
  name: string;
}

interface PostEditorFormProps {
  post: PostEditorInitial | null;
  categories: Option[];
  tags: Option[];
  authors: Option[];
  canPublish: boolean;
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostEditorForm({ post, categories, tags, authors, canPublish }: PostEditorFormProps) {
  const router = useRouter();
  const isNew = !post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage ?? "");
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "");
  const [authorId, setAuthorId] = useState(post?.authorId ?? "");
  const [tagIds, setTagIds] = useState<Set<string>>(new Set(post?.tagIds ?? []));
  const [status, setStatus] = useState(post?.status ?? "DRAFT");
  const [visibility, setVisibility] = useState(post?.visibility ?? "PUBLIC");
  const [publishedAt, setPublishedAt] = useState(toLocalInputValue(post?.publishedAt ?? null));
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(post?.scheduledAt ?? null));
  const [commentsEnabled, setCommentsEnabled] = useState(post?.commentsEnabled ?? true);
  const [featured, setFeatured] = useState(post?.featured ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [redirectPrompt, setRedirectPrompt] = useState<{ oldSlug: string; newSlug: string } | null>(null);
  const [redirectStatus, setRedirectStatus] = useState<string | null>(null);

  const readingTime = useMemo(() => calculateReadingTime(content), [content]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function toggleTag(id: string) {
    setTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    const payload = {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      featuredImage: featuredImage || null,
      gallery: post?.gallery ?? [],
      authorId: authorId || null,
      categoryId: categoryId || null,
      tagIds: [...tagIds],
      status,
      visibility,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      commentsEnabled,
      featured,
    };

    const url = isNew ? "/api/admin/blog/posts" : `/api/admin/blog/posts/${post.id}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(body.error ?? "Failed to save post.");
      return;
    }

    if (isNew) {
      router.push(`/admin/blog/posts/${body.post.id}`);
      return;
    }

    setSaveMessage("Saved.");
    if (post.status === "PUBLISHED" && slug !== post.slug) {
      setRedirectPrompt({ oldSlug: post.slug, newSlug: slug });
    }
    router.refresh();
  }

  async function handleCreateRedirect() {
    if (!redirectPrompt) return;
    setRedirectStatus(null);
    const res = await fetch("/api/admin/seo/redirects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: `/blog/${redirectPrompt.oldSlug}`, destination: `/blog/${redirectPrompt.newSlug}`, statusCode: 301 }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setRedirectStatus(body.error ?? "Failed to create redirect.");
      return;
    }
    setRedirectPrompt(null);
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          {post ? <TabsTrigger value="seo">SEO</TabsTrigger> : null}
          {post ? <TabsTrigger value="revisions">Revisions</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Post title" />
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
                <p className="text-xs text-muted-foreground">/blog/{slug || "…"}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="Short summary shown in listings and search results" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="featuredImage">Featured image URL</Label>
                <Input id="featuredImage" value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Content</Label>
                  <span className="text-xs text-muted-foreground">{readingTime} min read</span>
                </div>
                <ContentEditor value={content} onChange={setContent} />
              </div>
            </div>

            <aside className="space-y-4">
              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-semibold">Publishing</p>
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {POST_STATUSES.map((s) => {
                      const disabled = s === "PUBLISHED" && !canPublish && post?.status !== "PUBLISHED";
                      return (
                        <option key={s} value={s} disabled={disabled}>
                          {s}
                          {disabled ? " (no permission)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="visibility">Visibility</Label>
                  <select
                    id="visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="publishedAt">Publish date</Label>
                  <Input id="publishedAt" type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="scheduledAt">Scheduled date</Label>
                  <Input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 rounded border-input" />
                  Featured post
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={commentsEnabled} onChange={(e) => setCommentsEnabled(e.target.checked)} className="h-4 w-4 rounded border-input" />
                  Comments enabled
                </label>
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-semibold">Organization</p>
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="author">Author</Label>
                  <select
                    id="author"
                    value={authorId}
                    onChange={(e) => setAuthorId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">None</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tags</Label>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-input p-2 scrollbar-thin">
                    {tags.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tags yet.</p>
                    ) : (
                      tags.map((t) => (
                        <label key={t.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={tagIds.has(t.id)} onChange={() => toggleTag(t.id)} className="h-4 w-4 rounded border-input" />
                          {t.name}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        {post ? (
          <TabsContent value="seo">
            <SeoEditorPanel entityType="post" entityId={post.id} />
          </TabsContent>
        ) : null}

        {post ? (
          <TabsContent value="revisions">
            <RevisionsPanel postId={post.id} />
          </TabsContent>
        ) : null}
      </Tabs>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button onClick={handleSave} disabled={saving || !title || !slug}>
          {saving ? "Saving…" : isNew ? "Create post" : "Save changes"}
        </Button>
        {saveMessage ? <span className="text-sm text-muted-foreground">{saveMessage}</span> : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>

      <Dialog open={!!redirectPrompt} onOpenChange={(open) => !open && setRedirectPrompt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redirect the old URL?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This published post&apos;s URL changed from <code className="font-mono">/blog/{redirectPrompt?.oldSlug}</code> to{" "}
            <code className="font-mono">/blog/{redirectPrompt?.newSlug}</code>. Create a 301 redirect so existing links and search rankings carry over?
          </p>
          {redirectStatus ? <p className="text-sm text-destructive">{redirectStatus}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRedirectPrompt(null)}>
              No thanks
            </Button>
            <Button onClick={handleCreateRedirect}>Create redirect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
