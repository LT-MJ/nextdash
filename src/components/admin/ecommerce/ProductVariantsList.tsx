"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { VariantFormDialog, type VariantFormInitial } from "./VariantFormDialog";
import { formatCurrency } from "@/lib/utils";

export interface VariantRow extends VariantFormInitial {
  productPrice: number;
  currency: string;
}

export function ProductVariantsList({ productId, variants }: { productId: string; variants: VariantRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(variantId: string) {
    if (!confirm("Remove this variant? Its inventory record will also be removed.")) return;
    setDeletingId(variantId);
    const res = await fetch(`/api/admin/ecommerce/products/${productId}/variants/${variantId}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) router.refresh();
    else alert("Failed to remove variant.");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Each variant tracks its own inventory and can override price.</p>
        <VariantFormDialog
          productId={productId}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add variant
            </Button>
          }
        />
      </div>

      {variants.length === 0 ? (
        <EmptyState title="No variants yet." description="Add size/color/etc. combinations if this product needs them." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Options</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => {
              const options: Record<string, string> = variant.options ? JSON.parse(variant.options) : {};
              return (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium">{variant.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{variant.sku ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(variant.price ?? variant.productPrice, variant.currency)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <VariantFormDialog
                        productId={productId}
                        initial={variant}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Edit variant">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button variant="ghost" size="icon" aria-label="Remove variant" disabled={deletingId === variant.id} onClick={() => handleDelete(variant.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
