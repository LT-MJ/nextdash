"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { slugify } from "@/lib/utils";

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  parentName: string | null;
  featuredImage: string | null;
  postCount: number;
}

interface FormState {
  id: string | null;
  name: string;
  slug: string;
  slugTouched: boolean;
  description: string;
  parentId: string;
  featuredImage: string;
}

const EMPTY_FORM: FormState = { id: null, name: "", slug: "", slugTouched: false, description: "", parentId: "", featuredImage: "" };

export function CategoriesManager({ categories, canEdit }: { categories: CategoryRow[]; canEdit: boolean }) {
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

  function openEdit(cat: CategoryRow) {
    setForm({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      slugTouched: true,
      description: cat.description ?? "",
      parentId: cat.parentId ?? "",
      featuredImage: cat.featuredImage ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      parentId: form.parentId || null,
      featuredImage: form.featuredImage || null,
    };
    const url = form.id ? `/api/admin/blog/categories/${form.id}` : "/api/admin/blog/categories";
    const res = await fetch(url, { method: form.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save category.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(cat: CategoryRow) {
    if (!window.confirm(`Delete category "${cat.name}"? Its posts and subcategories will become uncategorized, not deleted.`)) return;
    await fetch(`/api/admin/blog/categories/${cat.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{form.id ? "Edit category" : "New category"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-name">Name</Label>
                  <Input
                    id="cat-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slugTouched ? f.slug : slugify(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-slug">Slug</Label>
                  <Input id="cat-slug" required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-parent">Parent category</Label>
                  <select
                    id="cat-parent"
                    value={form.parentId}
                    onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">None (top-level)</option>
                    {categories
                      .filter((c) => c.id !== form.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.parentName ? `${c.parentName} / ${c.name}` : c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-description">Description</Label>
                  <Textarea id="cat-description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-image">Featured image URL</Label>
                  <Input id="cat-image" value={form.featuredImage} onChange={(e) => setForm((f) => ({ ...f, featuredImage: e.target.value }))} placeholder="https://…" />
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

      {categories.length === 0 ? (
        <EmptyState icon={Search} title="No categories yet." description="Create a category to start organizing blog posts." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead>SEO</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">/blog/category/{cat.slug}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{cat.parentName ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{cat.postCount}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/seo/content/category/${cat.id}`} className="text-sm text-primary hover:underline">
                    Manage SEO
                  </Link>
                </TableCell>
                <TableCell>
                  {canEdit ? (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${cat.name}`} onClick={() => openEdit(cat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${cat.name}`} onClick={() => handleDelete(cat)}>
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
