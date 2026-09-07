import Link from "next/link";

export function Pagination({
  basePath,
  page,
  totalPages,
  extraParams,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  extraParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function href(target: number) {
    const params = new URLSearchParams();
    if (extraParams) {
      for (const [key, value] of Object.entries(extraParams)) {
        if (value) params.set(key, value);
      }
    }
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  return (
    <nav className="flex items-center justify-between border-t border-border pt-6 text-sm" aria-label="Pagination">
      <Link
        href={href(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`rounded-md border border-input px-4 py-2 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-accent"}`}
      >
        ← Previous
      </Link>
      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Link
        href={href(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`rounded-md border border-input px-4 py-2 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-accent"}`}
      >
        Next →
      </Link>
    </nav>
  );
}
