"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductGeneralValue {
  id?: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  barcode: string;
  brand: string;
  categoryId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "OUT_OF_STOCK";
  visibility: "PUBLIC" | "HIDDEN";
  featured: boolean;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  currency: string;
  weight: string;
  weightUnit: string;
  images: string[];
  specifications: { key: string; value: string }[];
  initialStock: string;
  reorderThreshold: string;
}

function emptyValue(): ProductGeneralValue {
  return {
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    sku: "",
    barcode: "",
    brand: "",
    categoryId: "",
    status: "DRAFT",
    visibility: "PUBLIC",
    featured: false,
    price: "0",
    compareAtPrice: "",
    costPrice: "",
    currency: "USD",
    weight: "",
    weightUnit: "kg",
    images: [],
    specifications: [],
    initialStock: "0",
    reorderThreshold: "5",
  };
}

export interface ProductGeneralFormProps {
  mode: "create" | "edit";
  categories: CategoryOption[];
  initial?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    sku: string | null;
    barcode: string | null;
    brand: string | null;
    categoryId: string | null;
    status: string;
    visibility: string;
    featured: boolean;
    price: number;
    compareAtPrice: number | null;
    costPrice: number | null;
    currency: string;
    weight: number | null;
    weightUnit: string;
    images: string | null;
    specifications: string | null;
  };
}

export function ProductGeneralForm({ mode, categories, initial }: ProductGeneralFormProps) {
  const router = useRouter();
  const [value, setValue] = useState<ProductGeneralValue>(() => {
    if (!initial) return emptyValue();
    const images: string[] = initial.images ? JSON.parse(initial.images) : [];
    const specsObj: Record<string, string> = initial.specifications ? JSON.parse(initial.specifications) : {};
    return {
      id: initial.id,
      name: initial.name,
      slug: initial.slug,
      description: initial.description ?? "",
      shortDescription: initial.shortDescription ?? "",
      sku: initial.sku ?? "",
      barcode: initial.barcode ?? "",
      brand: initial.brand ?? "",
      categoryId: initial.categoryId ?? "",
      status: initial.status as ProductGeneralValue["status"],
      visibility: initial.visibility as ProductGeneralValue["visibility"],
      featured: initial.featured,
      price: String(initial.price),
      compareAtPrice: initial.compareAtPrice != null ? String(initial.compareAtPrice) : "",
      costPrice: initial.costPrice != null ? String(initial.costPrice) : "",
      currency: initial.currency,
      weight: initial.weight != null ? String(initial.weight) : "",
      weightUnit: initial.weightUnit,
      images,
      specifications: Object.entries(specsObj).map(([key, val]) => ({ key, value: val })),
      initialStock: "0",
      reorderThreshold: "5",
    };
  });
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function set<K extends keyof ProductGeneralValue>(key: K, val: ProductGeneralValue[K]) {
    setValue((v) => ({ ...v, [key]: val }));
  }

  function handleNameChange(name: string) {
    set("name", name);
    if (!slugTouched) set("slug", slugify(name));
  }

  function updateImage(index: number, url: string) {
    setValue((v) => ({ ...v, images: v.images.map((img, i) => (i === index ? url : img)) }));
  }
  function addImage() {
    setValue((v) => ({ ...v, images: [...v.images, ""] }));
  }
  function removeImage(index: number) {
    setValue((v) => ({ ...v, images: v.images.filter((_, i) => i !== index) }));
  }

  function updateSpec(index: number, field: "key" | "value", val: string) {
    setValue((v) => ({ ...v, specifications: v.specifications.map((s, i) => (i === index ? { ...s, [field]: val } : s)) }));
  }
  function addSpec() {
    setValue((v) => ({ ...v, specifications: [...v.specifications, { key: "", value: "" }] }));
  }
  function removeSpec(index: number) {
    setValue((v) => ({ ...v, specifications: v.specifications.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    setError(null);
    setSavedMessage(null);

    const price = Number(value.price);
    if (!value.name.trim()) return setError("Name is required.");
    if (!value.slug.trim()) return setError("Slug is required.");
    if (!Number.isFinite(price) || price < 0) return setError("Price must be zero or more.");

    const specifications: Record<string, string> = {};
    for (const spec of value.specifications) {
      if (spec.key.trim()) specifications[spec.key.trim()] = spec.value;
    }

    const payload = {
      name: value.name.trim(),
      slug: value.slug.trim(),
      description: value.description || null,
      shortDescription: value.shortDescription || null,
      sku: value.sku.trim() || null,
      barcode: value.barcode.trim() || null,
      brand: value.brand.trim() || null,
      categoryId: value.categoryId || null,
      status: value.status,
      visibility: value.visibility,
      featured: value.featured,
      price,
      compareAtPrice: value.compareAtPrice ? Number(value.compareAtPrice) : null,
      costPrice: value.costPrice ? Number(value.costPrice) : null,
      currency: value.currency.trim() || "USD",
      weight: value.weight ? Number(value.weight) : null,
      weightUnit: value.weightUnit.trim() || "kg",
      images: value.images.map((i) => i.trim()).filter(Boolean),
      specifications,
      ...(mode === "create" ? { initialStock: Number(value.initialStock) || 0, reorderThreshold: Number(value.reorderThreshold) || 0 } : {}),
    };

    setSaving(true);
    const res = await fetch(mode === "create" ? "/api/admin/ecommerce/products" : `/api/admin/ecommerce/products/${initial!.id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (res.ok) {
      const body = await res.json();
      if (mode === "create") {
        router.push(`/admin/ecommerce/products/${body.product.id}`);
      } else {
        setSavedMessage("Saved.");
        router.refresh();
      }
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save product.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={value.name} onChange={(e) => handleNameChange(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={value.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", e.target.value);
            }}
          />
          <p className="text-xs text-muted-foreground">/shop/{value.slug || "…"}</p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="shortDescription">Short description</Label>
          <Textarea id="shortDescription" value={value.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} rows={2} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={value.description} onChange={(e) => set("description", e.target.value)} rows={6} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" value={value.sku} onChange={(e) => set("sku", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="barcode">Barcode</Label>
          <Input id="barcode" value={value.barcode} onChange={(e) => set("barcode", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" value={value.brand} onChange={(e) => set("brand", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Category</Label>
          <select id="categoryId" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm" value={value.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select id="status" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm" value={value.status} onChange={(e) => set("status", e.target.value as ProductGeneralValue["status"])}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="visibility">Visibility</Label>
          <select id="visibility" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm" value={value.visibility} onChange={(e) => set("visibility", e.target.value as ProductGeneralValue["visibility"])}>
            <option value="PUBLIC">Public</option>
            <option value="HIDDEN">Hidden</option>
          </select>
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-input" checked={value.featured} onChange={(e) => set("featured", e.target.checked)} />
            Featured product
          </label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="price">Price</Label>
          <Input id="price" type="number" min="0" step="0.01" value={value.price} onChange={(e) => set("price", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="compareAtPrice">Compare-at price</Label>
          <Input id="compareAtPrice" type="number" min="0" step="0.01" value={value.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="costPrice">Cost price</Label>
          <Input id="costPrice" type="number" min="0" step="0.01" value={value.costPrice} onChange={(e) => set("costPrice", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" value={value.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} maxLength={3} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="weight">Weight</Label>
          <Input id="weight" type="number" min="0" step="0.01" value={value.weight} onChange={(e) => set("weight", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weightUnit">Weight unit</Label>
          <select id="weightUnit" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm" value={value.weightUnit} onChange={(e) => set("weightUnit", e.target.value)}>
            <option value="kg">kg</option>
            <option value="lb">lb</option>
            <option value="g">g</option>
            <option value="oz">oz</option>
          </select>
        </div>

        {mode === "create" ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="initialStock">Initial stock</Label>
              <Input id="initialStock" type="number" min="0" step="1" value={value.initialStock} onChange={(e) => set("initialStock", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reorderThreshold">Reorder threshold</Label>
              <Input id="reorderThreshold" type="number" min="0" step="1" value={value.reorderThreshold} onChange={(e) => set("reorderThreshold", e.target.value)} />
            </div>
          </>
        ) : null}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Images</Label>
          <Button type="button" variant="outline" size="sm" onClick={addImage}>
            <Plus className="h-3.5 w-3.5" /> Add image URL
          </Button>
        </div>
        <div className="space-y-2">
          {value.images.length === 0 ? <p className="text-sm text-muted-foreground">No images yet.</p> : null}
          {value.images.map((img, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={img} onChange={(e) => updateImage(i, e.target.value)} placeholder="https://…" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Specifications</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSpec}>
            <Plus className="h-3.5 w-3.5" /> Add spec
          </Button>
        </div>
        <div className="space-y-2">
          {value.specifications.length === 0 ? <p className="text-sm text-muted-foreground">No specifications yet.</p> : null}
          {value.specifications.map((spec, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={spec.key} onChange={(e) => updateSpec(i, "key", e.target.value)} placeholder="Key (e.g. Material)" className="w-1/3" />
              <Input value={spec.value} onChange={(e) => updateSpec(i, "value", e.target.value)} placeholder="Value (e.g. Aluminum)" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </Button>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
        {savedMessage ? <span className="text-sm text-muted-foreground">{savedMessage}</span> : null}
      </div>
    </div>
  );
}
