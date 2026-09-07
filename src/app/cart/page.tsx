import type { Metadata } from "next";
import { CartPageClient } from "@/components/shop/CartPageClient";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the items in your cart before checkout.",
};

export default function CartPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Your Cart</h1>
      <CartPageClient />
    </div>
  );
}
