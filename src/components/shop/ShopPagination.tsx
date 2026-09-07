import Link from "next/link";

export function ShopPagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams = {},
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) if (value) params.set(key, value);
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav className="flex items-center justify-center gap-2 pt-4">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={`flex h-8 w-8 items-center justify-center rounded-md text-sm ${p === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
