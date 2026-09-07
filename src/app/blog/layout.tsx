import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

// See src/app/cart/layout.tsx for why this is forced dynamic — <SiteHeader>/
// <SiteFooter> read live, admin-editable settings.
export const dynamic = "force-dynamic";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
