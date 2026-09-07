"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ShopFilters({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          updateParam("search", search);
        }}
      >
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="w-64" />
        <Button type="submit" variant="secondary" size="sm">
          <Search className="h-4 w-4" />
        </Button>
      </form>
      {categories.length > 0 ? (
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          value={searchParams.get("category") ?? ""}
          onChange={(e) => updateParam("category", e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
