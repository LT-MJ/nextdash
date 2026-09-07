import { StorefrontChrome } from "@/components/shop/StorefrontChrome";

// StorefrontChrome now renders <SiteHeader>/<SiteFooter>, which read live,
// admin-editable settings (menus, header/footer settings) — child routes
// with no dynamic APIs of their own (e.g. /cart) would otherwise get
// statically prerendered at build time and never reflect later changes.
export const dynamic = "force-dynamic";

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontChrome>{children}</StorefrontChrome>;
}
