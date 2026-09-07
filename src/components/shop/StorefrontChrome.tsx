import { StorefrontHeader } from "./StorefrontHeader";

export function StorefrontChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StorefrontHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        This is a demo storefront. Checkout is manual/invoice-style — no payment is collected online.
      </footer>
    </div>
  );
}
