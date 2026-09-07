"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./useCart";

export function StorefrontHeader() {
  const { lines, hydrated } = useCart();
  const itemCount = lines.reduce((acc, l) => acc + l.quantity, 0);

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Nextdash
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/shop" className="text-muted-foreground hover:text-foreground">
            Shop
          </Link>
          <Link href="/cart" className="relative flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <ShoppingCart className="h-4 w-4" />
            Cart
            {hydrated && itemCount > 0 ? (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">{itemCount}</span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
