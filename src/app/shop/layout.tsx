import { StorefrontChrome } from "@/components/shop/StorefrontChrome";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontChrome>{children}</StorefrontChrome>;
}
