import Link from "next/link";

export interface CategoryChipData {
  slug: string;
  name: string;
  postCount: number;
}

export function CategoryChips({ categories, activeSlug }: { categories: CategoryChipData[]; activeSlug?: string }) {
  if (categories.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/blog/category/${c.slug}`}
          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
            activeSlug === c.slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          {c.name} <span className="opacity-70">({c.postCount})</span>
        </Link>
      ))}
    </div>
  );
}
