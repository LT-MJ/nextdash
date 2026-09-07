import { cn } from "@/lib/utils";

/**
 * Renders BlogPost.content (trusted admin-authored HTML) with descendant
 * styling — there is no Tailwind Typography plugin installed, so structural
 * styling is applied via arbitrary-variant descendant selectors instead.
 */
export function PostContent({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-none text-[15px] leading-7 text-foreground",
        "[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold",
        "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold",
        "[&_p]:my-4 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold",
        "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
        "[&_img]:my-6 [&_img]:rounded-lg [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-sm [&_code]:font-mono",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
