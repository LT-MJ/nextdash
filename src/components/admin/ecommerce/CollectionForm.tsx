"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";

interface CategoryOption {
  id: string;
  name: string;
}

export interface CollectionFormInitial {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  type: string;
  rules: string | null;
}

export function CollectionForm({ mode, categories, initial }: { mode: "create" | "edit"; categories: CategoryOption[]; initial?: CollectionFormInitial }) {
  const router = useRouter();
  const parsedRules: { categoryId?: string; minPrice?: number; maxPrice?: number; brand?: string; featured?: boolean } = initial?.rules
    ? JSON.parse(initial.rules)
    : {};

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [type, setType] = useState<"MANUAL" | "AUTOMATIC">((initial?.type as "MANUAL" | "AUTOMATIC") ?? "MANUAL");
  const [ruleCategoryId, setRuleCategoryId] = useState(parsedRules.categoryId ?? "");
  const [ruleMinPrice, setRuleMinPrice] = useState(parsedRules.minPrice != null ? String(parsedRules.minPrice) : "");
  const [ruleMaxPrice, setRuleMaxPrice] = useState(parsedRules.maxPrice != null ? String(parsedRules.maxPrice) : "");
  const [ruleBrand, setRuleBrand] = useState(parsedRules.brand ?? "");
  const [ruleFeatured, setRuleFeatured] = useState(parsedRules.featured ?? false);
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

    const rules =
      type === "AUTOMATIC"
        ? {
            ...(ruleCategoryId ? { categoryId: ruleCategoryId } : {}),
            ...(ruleMinPrice ? { minPrice: Number(ruleMinPrice) } : {}),
            ...(ruleMaxPrice ? { maxPrice: Number(ruleMaxPrice) } : {}),
            ...(ruleBrand.trim() ? { brand: ruleBrand.trim() } : {}),
            ...(ruleFeatured ? { featured: true } : {}),
          }
        : null;

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description || null,
      image: image.trim() || null,
      type,
      rules,
    };

    setSaving(true);
    const res = await fetch(mode === "create" ? "/api/admin/ecommerce/collections" : `/api/admin/ecommerce/collections/${initial!.id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      const body = await res.json();
      if (mode === "create") router.push(`/admin/ecommerce/collections/${body.collection.id}`);
      else {
        setSavedMessage("Saved.");
        router.refresh();
      }
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save collection.");
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="col-name">Name</Label>
        <Input id="col-name" value={name} onChange={(e) => handleNameChange(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="col-slug">Slug</Label>
        <Input
          id="col-slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
        <p className="text-xs text-muted-foreground">/collections/{slug || "…"}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="col-description">Description</Label>
        <Textarea id="col-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="col-image">Image URL</Label>
        <Input id="col-image" value={image} onChange={(e) => setImage(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="col-type">Type</Label>
        <select id="col-type" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm" value={type} onChange={(e) => setType(e.target.value as "MANUAL" | "AUTOMATIC")}>
          <option value="MANUAL">Manual — hand-pick products</option>
          <option value="AUTOMATIC">Automatic — matched by rules</option>
        </select>
      </div>

      {type === "AUTOMATIC" ? (
        <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium">Matching rules (a product must satisfy all of the ones you set)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rule-category">Category</Label>
              <select id="rule-category" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm" value={ruleCategoryId} onChange={(e) => setRuleCategoryId(e.target.value)}>
                <option value="">Any</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-brand">Brand</Label>
              <Input id="rule-brand" value={ruleBrand} onChange={(e) => setRuleBrand(e.target.value)} placeholder="Any" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-min">Min price</Label>
              <Input id="rule-min" type="number" min="0" step="0.01" value={ruleMinPrice} onChange={(e) => setRuleMinPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-max">Max price</Label>
              <Input id="rule-max" type="number" min="0" step="0.01" value={ruleMaxPrice} onChange={(e) => setRuleMaxPrice(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-input" checked={ruleFeatured} onChange={(e) => setRuleFeatured(e.target.checked)} />
            Featured products only
          </label>
          <p className="text-xs text-muted-foreground">Only ACTIVE, publicly visible products are ever matched.</p>
        </div>
      ) : null}

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create collection" : "Save changes"}
        </Button>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
        {savedMessage ? <span className="text-sm text-muted-foreground">{savedMessage}</span> : null}
      </div>
    </div>
  );
}
