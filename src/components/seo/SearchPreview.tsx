export function SearchPreview({ title, description, url }: { title: string; description: string | null; url: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Google preview</p>
      <div className="max-w-xl font-sans">
        <p className="truncate text-sm text-[#202124] dark:text-neutral-300">{url}</p>
        <p className="truncate text-xl text-[#1a0dab] dark:text-[#8ab4f8]">{title || "Untitled page"}</p>
        <p className="line-clamp-2 text-sm text-[#4d5156] dark:text-neutral-400">
          {description || "No meta description set — search engines may generate one automatically from page content."}
        </p>
      </div>
    </div>
  );
}
