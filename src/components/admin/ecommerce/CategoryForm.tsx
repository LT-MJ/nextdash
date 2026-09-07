"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";

interface ParentOption {
  id: string;
  name: string;
}

export interface CategoryFormInitial {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  image: string | null;
}

export function CategoryForm({ mode, parentOptions, initial }: { mode: "create" | "edit"; parentOptions: ParentOption[]; initial?: CategoryFormInitial }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [parentId, setParentId] = useState(initial?.parentId ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function handleNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) return setError("Name is required.");
    if (!slug.trim()) return setError("Slug is required.");

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description || null,
      parentId: parentId || null,
      image: image.trim() || null,
    };

    setSaving(true);
    const res = await fetch(mode === "create" ? "/api/admin/ecommerce/categories" : `/api/admin/ecommerce/categories/${initial!.id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      const body = await res.json();
      if (mode === "create") router.push(`/admin/ecommerce/categories/${body.category.id}`);
      else {
        setSavedMessage("Saved.");
        router.refresh();
      }
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save category.");
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cat-name">Name</Label>
        <Input id="cat-name" value={name} onChange={(e) => handleNameChange(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cat-slug">Slug</Label>
        <Input
          id="cat-slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
        <p className="text-xs text-muted-foreground">/category/{slug || "…"}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cat-description">Description</Label>
        <Textarea id="cat-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cat-parent">Parent category</Label>
        <select id="cat-parent" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm" value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">— None (top level) —</option>
          {parentOptions
            .filter((p) => p.id !== initial?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cat-image">Image URL</Label>
        <Input id="cat-image" value={image} onChange={(e) => setImage(e.target.value)} />
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create category" : "Save changes"}
        </Button>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
        {savedMessage ? <span className="text-sm text-muted-foreground">{savedMessage}</span> : null}
      </div>
    </div>
  );
}
