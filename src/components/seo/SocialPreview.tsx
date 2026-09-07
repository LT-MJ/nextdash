import { ImageOff } from "lucide-react";

export function SocialPreview({
  title,
  description,
  image,
  siteName,
  variant,
}: {
  title: string;
  description: string | null;
  image: string | null;
  siteName: string;
  variant: "facebook" | "twitter";
}) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {variant === "facebook" ? "Facebook / Open Graph preview" : "Twitter / X preview"}
      </p>
      <div className="max-w-sm overflow-hidden rounded-lg border border-border">
        <div className="flex aspect-[1.91/1] items-center justify-center bg-muted">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="h-8 w-8 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="space-y-1 bg-muted/50 p-3">
          <p className="text-xs uppercase text-muted-foreground">{siteName}</p>
          <p className="truncate text-sm font-semibold">{title || "Untitled page"}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">{description || "No description set."}</p>
        </div>
      </div>
    </div>
  );
}
