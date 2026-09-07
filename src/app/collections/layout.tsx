import { StorefrontChrome } from "@/components/shop/StorefrontChrome";

// See src/app/cart/layout.tsx for why this is forced dynamic.
export const dynamic = "force-dynamic";

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontChrome>{children}</StorefrontChrome>;
}
