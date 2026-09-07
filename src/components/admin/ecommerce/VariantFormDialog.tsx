"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export interface VariantFormInitial {
  id: string;
  name: string;
  sku: string | null;
  price: number | null;
  compareAtPrice: number | null;
  barcode: string | null;
  image: string | null;
  weight: number | null;
  options: string | null;
  position: number;
}

export function VariantFormDialog({ productId, initial, trigger }: { productId: string; initial?: VariantFormInitial; trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = !!initial;
  const initialOptions: Record<string, string> = initial?.options ? JSON.parse(initial.options) : {};

  const [name, setName] = useState(initial?.name ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(initial?.compareAtPrice != null ? String(initial.compareAtPrice) : "");
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [weight, setWeight] = useState(initial?.weight != null ? String(initial.weight) : "");
  const [options, setOptions] = useState<{ key: string; value: string }[]>(Object.entries(initialOptions).map(([key, value]) => ({ key, value })));
  const [initialStock, setInitialStock] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateOption(index: number, field: "key" | "value", val: string) {
    setOptions((o) => o.map((item, i) => (i === index ? { ...item, [field]: val } : item)));
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) return setError("Name is required.");

    const optionsObj: Record<string, string> = {};
    for (const opt of options) if (opt.key.trim()) optionsObj[opt.key.trim()] = opt.value;

    const payload = {
      name: name.trim(),
      sku: sku.trim() || null,
      price: price ? Number(price) : null,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      barcode: barcode.trim() || null,
      image: image.trim() || null,
      weight: weight ? Number(weight) : null,
      options: optionsObj,
      ...(isEdit ? {} : { initialStock: Number(initialStock) || 0 }),
    };

    setSaving(true);
    const url = isEdit
      ? `/api/admin/ecommerce/products/${productId}/variants/${initial!.id}`
      : `/api/admin/ecommerce/products/${productId}/variants`;
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save variant.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit variant" : "Add variant"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="variant-name">Name</Label>
            <Input id="variant-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Red / Large" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="variant-sku">SKU</Label>
              <Input id="variant-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variant-barcode">Barcode</Label>
              <Input id="variant-barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variant-price">Price override</Label>
              <Input id="variant-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Uses product price if blank" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variant-compare">Compare-at price</Label>
              <Input id="variant-compare" type="number" min="0" step="0.01" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variant-weight">Weight</Label>
              <Input id="variant-weight" type="number" min="0" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            {!isEdit ? (
              <div className="space-y-1.5">
                <Label htmlFor="variant-stock">Initial stock</Label>
                <Input id="variant-stock" type="number" min="0" step="1" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} />
              </div>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variant-image">Image URL</Label>
            <Input id="variant-image" value={image} onChange={(e) => setImage(e.target.value)} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Options</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setOptions((o) => [...o, { key: "", value: "" }])}>
                <Plus className="h-3.5 w-3.5" /> Add option
              </Button>
            </div>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={opt.key} onChange={(e) => updateOption(i, "key", e.target.value)} placeholder="e.g. Size" className="w-1/3" />
                  <Input value={opt.value} onChange={(e) => updateOption(i, "value", e.target.value)} placeholder="e.g. Large" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setOptions((o) => o.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save variant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
