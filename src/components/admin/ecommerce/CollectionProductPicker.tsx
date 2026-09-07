"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";

export interface CollectionProductRow {
  productId: string;
  name: string;
  sku: string | null;
  price: number;
  currency: string;
}

interface SearchResult {
  id: string;
  name: string;
  sku: string | null;
}

export function CollectionProductPicker({ collectionId, initialProducts }: { collectionId: string; initialProducts: CollectionProductRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const existingIds = new Set(initialProducts.map((p) => p.productId));

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    const res = await fetch(`/api/admin/ecommerce/products?search=${encodeURIComponent(query)}`);
    setSearching(false);
    if (res.ok) {
      const body = await res.json();
      setResults(body.products.map((p: { id: string; name: string; sku: string | null }) => ({ id: p.id, name: p.name, sku: p.sku })));
    }
  }

  async function handleAdd(productId: string) {
    setBusyId(productId);
    const res = await fetch(`/api/admin/ecommerce/collections/${collectionId}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setBusyId(null);
    if (res.ok) router.refresh();
    else {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Failed to add product.");
    }
  }

  async function handleRemove(productId: string) {
    setBusyId(productId);
    const res = await fetch(`/api/admin/ecommerce/collections/${collectionId}/products/${productId}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) router.refresh();
    else alert("Failed to remove product.");
  }

  async function handleMove(productId: string, direction: "up" | "down") {
    setBusyId(productId);
    const res = await fetch(`/api/admin/ecommerce/collections/${collectionId}/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    setBusyId(null);
    if (res.ok) router.refresh();
    else alert("Failed to reorder.");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium">Add products</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products by name or SKU…" />
          <Button type="submit" variant="secondary" disabled={searching}>
            {searching ? "Searching…" : "Search"}
          </Button>
        </form>
        {results.length > 0 ? (
          <div className="mt-3 space-y-1 rounded-md border border-border p-2">
            {results.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.sku ?? "No SKU"}</p>
                </div>
                <Button size="sm" variant="outline" disabled={existingIds.has(r.id) || busyId === r.id} onClick={() => handleAdd(r.id)}>
                  <Plus className="h-3.5 w-3.5" /> {existingIds.has(r.id) ? "Added" : "Add"}
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Products in this collection</p>
        {initialProducts.length === 0 ? (
          <EmptyState title="No products in this collection yet." description="Search above to add some." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-32">Order</TableHead>
                <TableHead className="w-16">Remove</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialProducts.map((p, i) => (
                <TableRow key={p.productId}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs">{p.sku ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(p.price, p.currency)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" disabled={i === 0 || busyId === p.productId} onClick={() => handleMove(p.productId, "up")} aria-label="Move up">
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" disabled={i === initialProducts.length - 1 || busyId === p.productId} onClick={() => handleMove(p.productId, "down")} aria-label="Move down">
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" disabled={busyId === p.productId} onClick={() => handleRemove(p.productId)} aria-label="Remove">
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
