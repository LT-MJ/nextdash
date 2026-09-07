"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "./useCart";
import { formatCurrency } from "@/lib/utils";

export interface VariantOption {
  id: string;
  name: string;
  price: number | null;
  compareAtPrice: number | null;
  options: Record<string, string>;
  stock: number;
}

export function ProductPurchasePanel({
  productId,
  basePrice,
  baseCompareAtPrice,
  currency,
  baseStock,
  variants,
}: {
  productId: string;
  basePrice: number;
  baseCompareAtPrice: number | null;
  currency: string;
  baseStock: number;
  variants: VariantOption[];
}) {
  const { addItem } = useCart();
  const optionKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const v of variants) for (const k of Object.keys(v.options)) keys.add(k);
    return [...keys];
  }, [variants]);

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (variants.length > 0) for (const k of optionKeys) init[k] = variants[0].options[k] ?? "";
    return init;
  });
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const matchedVariant = useMemo(() => {
    if (variants.length === 0) return null;
    return variants.find((v) => optionKeys.every((k) => v.options[k] === selected[k])) ?? null;
  }, [variants, optionKeys, selected]);

  const hasVariants = variants.length > 0;
  const price = hasVariants ? matchedVariant?.price ?? basePrice : basePrice;
  const compareAtPrice = hasVariants ? matchedVariant?.compareAtPrice ?? null : baseCompareAtPrice;
  const stock = hasVariants ? matchedVariant?.stock ?? 0 : baseStock;
  const purchasable = hasVariants ? !!matchedVariant && stock > 0 : stock > 0;

  function handleAdd() {
    addItem(productId, hasVariants ? matchedVariant?.id ?? null : null, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold">{formatCurrency(price, currency)}</span>
        {compareAtPrice && compareAtPrice > price ? <span className="text-lg text-muted-foreground line-through">{formatCurrency(compareAtPrice, currency)}</span> : null}
      </div>

      {hasVariants
        ? optionKeys.map((key) => {
            const values = [...new Set(variants.map((v) => v.options[key]).filter(Boolean))];
            return (
              <div key={key} className="space-y-1.5">
                <label className="text-sm font-medium">{key}</label>
                <select
                  className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                  value={selected[key] ?? ""}
                  onChange={(e) => setSelected((s) => ({ ...s, [key]: e.target.value }))}
                >
                  {values.map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              </div>
            );
          })
        : null}

      <p className="text-sm">
        {purchasable ? (
          stock <= 5 ? (
            <span className="text-warning">Only {stock} left in stock</span>
          ) : (
            <span className="text-success">In stock</span>
          )
        ) : (
          <span className="text-destructive">Out of stock</span>
        )}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md border border-input">
          <Button type="button" variant="ghost" size="icon" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center text-sm">{quantity}</span>
          <Button type="button" variant="ghost" size="icon" onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))} aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleAdd} disabled={!purchasable} className="flex-1 sm:flex-none">
          {added ? (
            <>
              <Check className="h-4 w-4" /> Added
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" /> Add to cart
            </>
          )}
        </Button>
      </div>
      {added ? (
        <p className="text-sm text-muted-foreground">
          Added to your cart.{" "}
          <Link href="/cart" className="text-primary hover:underline">
            View cart
          </Link>
        </p>
      ) : null}
    </div>
  );
}
