"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface FilterSelect {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

/** Generic list-page filter bar: a search box plus a set of select dropdowns, all synced to the URL query string. */
export function ListFilters({
  selects,
  searchPlaceholder = "Search…",
  searchKey = "search",
  showSearch = true,
}: {
  selects: FilterSelect[];
  searchPlaceholder?: string;
  searchKey?: string;
  showSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get(searchKey) ?? "");
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {showSearch ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateParam(searchKey, search);
          }}
        >
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder} className="w-64" />
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
      ) : null}
      {selects.map((select) => (
        <select
          key={select.key}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          value={searchParams.get(select.key) ?? ""}
          onChange={(e) => updateParam(select.key, e.target.value)}
        >
          <option value="">{select.label}: All</option>
          {select.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
