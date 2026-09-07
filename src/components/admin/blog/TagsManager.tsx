"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Tags as TagsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { slugify } from "@/lib/utils";

export interface TagRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
}

interface FormState {
  id: string | null;
  name: string;
  slug: string;
  slugTouched: boolean;
  description: string;
}

const EMPTY_FORM: FormState = { id: null, name: "", slug: "", slugTouched: false, description: "" };

export function TagsManager({ tags, canEdit }: { tags: TagRow[]; canEdit: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  }

  function openEdit(tag: TagRow) {
    setForm({ id: tag.id, name: tag.name, slug: tag.slug, slugTouched: true, description: tag.description ?? "" });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { name: form.name, slug: form.slug, description: form.description || null };
    const url = form.id ? `/api/admin/blog/tags/${form.id}` : "/api/admin/blog/tags";
    const res = await fetch(url, { method: form.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save tag.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(tag: TagRow) {
    if (!window.confirm(`Delete tag "${tag.name}"?`)) return;
    await fetch(`/api/admin/blog/tags/${tag.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{form.id ? "Edit tag" : "New tag"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tag-name">Name</Label>
                  <Input
                    id="tag-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slugTouched ? f.slug : slugify(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tag-slug">Slug</Label>
                  <Input id="tag-slug" required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tag-description">Description</Label>
                  <Textarea id="tag-description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <DialogFooter>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}

      {tags.length === 0 ? (
        <EmptyState icon={TagsIcon} title="No tags yet." description="Create a tag to start labeling blog posts." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell>
                  <p className="font-medium">{tag.name}</p>
                  <p className="text-xs text-muted-foreground">/blog/tag/{tag.slug}</p>
                </TableCell>
                <TableCell>
                  {tag.postCount === 0 ? <Badge variant="warning">Unused</Badge> : <Badge variant="outline">{tag.postCount}</Badge>}
                </TableCell>
                <TableCell>
                  {canEdit ? (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${tag.name}`} onClick={() => openEdit(tag)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${tag.name}`} onClick={() => handleDelete(tag)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
