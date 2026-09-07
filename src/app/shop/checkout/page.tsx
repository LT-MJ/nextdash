import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order.",
};

export default function CheckoutPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
