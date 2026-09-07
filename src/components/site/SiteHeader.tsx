import Link from "next/link";
import { resolveSiteChrome, type ResolvedMenuNode } from "@/lib/site/chrome-render";
import { cn } from "@/lib/utils";

const LAYOUT_CLASSES: Record<string, string> = {
  "logo-left-nav-right": "flex-row items-center justify-between",
  centered: "flex-row items-center justify-center gap-8",
  "logo-center-nav-below": "flex-col items-center gap-2",
};

export async function SiteHeader({ endSlot }: { endSlot?: React.ReactNode }) {
  const chrome = await resolveSiteChrome();
  const logo = chrome.logo.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={chrome.logo.imageUrl} alt={chrome.logo.altText ?? chrome.siteName} className="h-8 w-auto" />
  ) : (
    <span className="text-lg font-bold tracking-tight">{chrome.logo.text || chrome.siteName}</span>
  );

  return (
    <header className={cn("border-b border-border bg-card", chrome.headerSticky && "sticky top-0 z-40")}>
      <div className={cn("mx-auto flex max-w-6xl px-6 py-4", LAYOUT_CLASSES[chrome.headerLayout] ?? LAYOUT_CLASSES["logo-left-nav-right"])}>
        <Link href="/">{logo}</Link>
        {chrome.primaryMenu.length > 0 ? (
          <nav className="flex items-center gap-6 text-sm font-medium">
            {chrome.primaryMenu.map((node) => (
              <MenuNode key={node.id} node={node} />
            ))}
          </nav>
        ) : null}
        {endSlot ? <div className="ml-auto">{endSlot}</div> : null}
      </div>
    </header>
  );
}

function MenuNode({ node }: { node: ResolvedMenuNode }) {
  const target = node.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {};
  if (node.children.length === 0) {
    return (
      <Link href={node.href} className="text-muted-foreground hover:text-foreground" {...target}>
        {node.label}
      </Link>
    );
  }
  return (
    <div className="group relative">
      <Link href={node.href} className="text-muted-foreground hover:text-foreground" {...target}>
        {node.label}
      </Link>
      <div className="absolute left-0 top-full z-10 hidden min-w-[10rem] flex-col rounded-md border border-border bg-card p-1 shadow-md group-hover:flex">
        {node.children.map((child) => (
          <Link key={child.id} href={child.href} className="rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            {child.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
