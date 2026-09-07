"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RenderedNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface RenderedNavSection {
  label: string;
  items: RenderedNavItem[];
}

export function AdminSidebar({ sections }: { sections: RenderedNavSection[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <LayoutGrid className="h-5 w-5 text-primary" aria-hidden />
        <span className="text-sm font-bold tracking-tight">Nextdash</span>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                        active ? "bg-accent text-accent-foreground" : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
