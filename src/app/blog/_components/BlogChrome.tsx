import Link from "next/link";
import { getGlobalSeoSettings } from "@/lib/seo/services/settings";

/** Minimal shared header/footer for the public blog surface (spec items 6). */
export async function BlogChrome({ children }: { children: React.ReactNode }) {
  const settings = await getGlobalSeoSettings();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            {settings.siteName}
          </Link>
          <nav className="flex gap-5 text-sm font-medium">
            <Link href="/blog" className="text-primary">
              Blog
            </Link>
            <Link href="/shop" className="text-muted-foreground hover:text-foreground">
              Shop
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
      <footer className="border-t border-border py-8">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {settings.siteName}
        </p>
      </footer>
    </div>
  );
}
