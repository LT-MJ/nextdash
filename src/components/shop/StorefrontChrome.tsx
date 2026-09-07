import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CartBadge } from "./CartBadge";

export function StorefrontChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader endSlot={<CartBadge />} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      <p className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        This is a demo storefront. Checkout is manual/invoice-style — no payment is collected online.
      </p>
      <SiteFooter />
    </div>
  );
}
