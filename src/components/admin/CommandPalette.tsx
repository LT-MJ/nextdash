"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FileText, Newspaper, ShoppingBag, ClipboardList, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "post" | "product" | "page" | "order";
  id: string;
  title: string;
  href: string;
  status?: string;
  seoScore?: number | null;
}

const TYPE_ICON = { post: Newspaper, product: ShoppingBag, page: FileText, order: ClipboardList } as const;

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-24 z-50 w-full max-w-xl -translate-x-1/2 rounded-lg border border-border bg-card shadow-xl"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Search admin</DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <SearchIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search blog posts, products, orders, pages…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
            {loading ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">Searching…</p> : null}
            {!loading && query.trim().length >= 2 && results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;.</p>
            ) : null}
            {!loading && query.trim().length < 2 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Type at least 2 characters to search.</p>
            ) : null}
            <ul className="space-y-0.5">
              {results.map((result) => {
                const Icon = TYPE_ICON[result.type];
                return (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      onClick={() => {
                        onOpenChange(false);
                        setQuery("");
                        router.push(result.href);
                      }}
                      className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted")}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
                      <span className="flex-1 truncate">{result.title}</span>
                      {result.status ? <span className="text-xs text-muted-foreground">{result.status}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
