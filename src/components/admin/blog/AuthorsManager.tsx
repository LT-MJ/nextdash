"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { slugify } from "@/lib/utils";

export interface AuthorRow {
  id: string;
  name: string;
  slug: string;
  profileImage: string | null;
  bio: string | null;
  email: string | null;
  website: string | null;
  socialProfiles: string[];
  postCount: number;
}

interface FormState {
  id: string | null;
  name: string;
  slug: string;
  slugTouched: boolean;
  profileImage: string;
  bio: string;
  email: string;
  website: string;
  socialProfiles: string;
}

const EMPTY_FORM: FormState = { id: null, name: "", slug: "", slugTouched: false, profileImage: "", bio: "", email: "", website: "", socialProfiles: "" };

export function AuthorsManager({ authors, canEdit }: { authors: AuthorRow[]; canEdit: boolean }) {
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

  function openEdit(author: AuthorRow) {
    setForm({
      id: author.id,
      name: author.name,
      slug: author.slug,
      slugTouched: true,
      profileImage: author.profileImage ?? "",
      bio: author.bio ?? "",
      email: author.email ?? "",
      website: author.website ?? "",
      socialProfiles: author.socialProfiles.join(", "),
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
      profileImage: form.profileImage || null,
      bio: form.bio || null,
      email: form.email || null,
      website: form.website || null,
      socialProfiles: form.socialProfiles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const url = form.id ? `/api/admin/blog/authors/${form.id}` : "/api/admin/blog/authors";
    const res = await fetch(url, { method: form.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save author.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(author: AuthorRow) {
    if (!window.confirm(`Delete author "${author.name}"? Their posts will become unattributed, not deleted.`)) return;
    await fetch(`/api/admin/blog/authors/${author.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New author
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{form.id ? "Edit author" : "New author"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="author-name">Name</Label>
                  <Input
                    id="author-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slugTouched ? f.slug : slugify(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="author-slug">Slug</Label>
                  <Input id="author-slug" required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value, slugTouched: true }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="author-image">Profile image URL</Label>
                  <Input id="author-image" value={form.profileImage} onChange={(e) => setForm((f) => ({ ...f, profileImage: e.target.value }))} placeholder="https://…" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="author-bio">Bio</Label>
                  <Textarea id="author-bio" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="author-email">Email</Label>
                    <Input id="author-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="author-website">Website</Label>
                    <Input id="author-website" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://…" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="author-social">Social profile URLs (comma-separated)</Label>
                  <Input
                    id="author-social"
                    value={form.socialProfiles}
                    onChange={(e) => setForm((f) => ({ ...f, socialProfiles: e.target.value }))}
                    placeholder="https://twitter.com/…, https://linkedin.com/in/…"
                  />
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

      {authors.length === 0 ? (
        <EmptyState icon={Users} title="No authors yet." description="Create an author to attribute blog posts." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead>SEO</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {authors.map((author) => (
              <TableRow key={author.id}>
                <TableCell>
                  <p className="font-medium">{author.name}</p>
                  <p className="text-xs text-muted-foreground">/blog/author/{author.slug}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{author.postCount}</Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/seo/content/author/${author.id}`} className="text-sm text-primary hover:underline">
                    Manage SEO
                  </Link>
                </TableCell>
                <TableCell>
                  {canEdit ? (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${author.name}`} onClick={() => openEdit(author)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${author.name}`} onClick={() => handleDelete(author)}>
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
