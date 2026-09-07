"use client";

import { useCallback, useEffect, useState } from "react";

export interface CartLine {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

const STORAGE_KEY = "nextdash_cart";
const EVENT_NAME = "nextdash-cart-updated";

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // localStorage unavailable (private browsing, blocked site data, etc.) — cart just won't persist.
  }
}

function lineKey(productId: string, variantId?: string | null) {
  return `${productId}::${variantId ?? ""}`;
}

/**
 * Client-side cart backed by localStorage — private to this browser, never
 * synced to the server or other viewers. Prices are never trusted from here;
 * every page that displays a total re-fetches authoritative pricing from
 * `/api/shop/cart/price`.
 */
export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readCart());
    setHydrated(true);
    function handleUpdate() {
      setLines(readCart());
    }
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const addItem = useCallback((productId: string, variantId: string | null | undefined, quantity: number) => {
    const current = readCart();
    const key = lineKey(productId, variantId);
    const existing = current.find((l) => lineKey(l.productId, l.variantId) === key);
    const next = existing
      ? current.map((l) => (lineKey(l.productId, l.variantId) === key ? { ...l, quantity: l.quantity + quantity } : l))
      : [...current, { productId, variantId: variantId ?? null, quantity }];
    writeCart(next);
    setLines(next);
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string | null | undefined, quantity: number) => {
    const current = readCart();
    const key = lineKey(productId, variantId);
    const next = quantity <= 0 ? current.filter((l) => lineKey(l.productId, l.variantId) !== key) : current.map((l) => (lineKey(l.productId, l.variantId) === key ? { ...l, quantity } : l));
    writeCart(next);
    setLines(next);
  }, []);

  const removeItem = useCallback((productId: string, variantId: string | null | undefined) => {
    const current = readCart();
    const next = current.filter((l) => lineKey(l.productId, l.variantId) !== lineKey(productId, variantId));
    writeCart(next);
    setLines(next);
  }, []);

  const clearCart = useCallback(() => {
    writeCart([]);
    setLines([]);
  }, []);

  return { lines, hydrated, addItem, updateQuantity, removeItem, clearCart };
}
