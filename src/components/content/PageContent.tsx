import { cn } from "@/lib/utils";
import { parseBlocks } from "@/lib/pages/blocks/schema";
import { renderBlocksToHtml } from "@/lib/pages/blocks/render";

/**
 * Renders a CMS Page's content inside a real React Server Component (the
 * homepage/blog-page Reading Settings surfaces — see src/lib/site/settings.ts).
 * Styling mirrors src/app/blog/_components/PostContent.tsx (no Typography
 * plugin installed, so descendant selectors do the work). Block-based pages
 * reuse the same string renderer the public catch-all route uses
 * (src/lib/pages/blocks/render.ts) rather than a separate React block
 * renderer — see docs/pages.md for why the two rendering paths exist.
 */
export function PageContent({
  content,
  contentFormat,
  blocks,
  className,
}: {
  content: string;
  contentFormat: string;
  blocks: string | null;
  className?: string;
}) {
  const html = contentFormat === "blocks" ? renderBlocksToHtml(parseBlocks(blocks)) : content;

  return (
    <div
      className={cn(
        "max-w-none text-[15px] leading-7 text-foreground",
        "[&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-bold",
        "[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold",
        "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold",
        "[&_p]:my-4 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold",
        "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
        "[&_img]:my-6 [&_img]:rounded-lg [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-sm [&_code]:font-mono",
        "[&_.blocks-columns]:my-4 [&_.blocks-columns]:grid [&_.blocks-columns]:gap-6",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
