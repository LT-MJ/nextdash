import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <span key={item.href} className="flex items-center gap-1">
          {i > 0 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
          {i === items.length - 1 ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-foreground hover:underline">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
