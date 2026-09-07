"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./useCart";

/** Extracted from the old StorefrontHeader so <SiteHeader> can stay a Server Component and just take this as its endSlot. */
export function CartBadge() {
  const { lines, hydrated } = useCart();
  const itemCount = lines.reduce((acc, l) => acc + l.quantity, 0);

  return (
    <Link href="/cart" className="relative flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
      <ShoppingCart className="h-4 w-4" />
      Cart
      {hydrated && itemCount > 0 ? (
        <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">{itemCount}</span>
      ) : null}
    </Link>
  );
}
