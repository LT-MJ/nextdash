"use client";

import { useRef, useState } from "react";
import { Bold, Italic, Heading2, Heading3, Link as LinkIcon, Quote, List, ListOrdered, ImageIcon, Code2, Eye, Pencil, type LucideIcon } from "lucide-react";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Pragmatic block-based HTML editor for BlogPost.content: a plain textarea
 * bound to the raw HTML string, with a toolbar that wraps the current
 * selection in the relevant tags, plus a live preview toggle. No rich-text
 * editor dependency is added (none is installed and the spec asks that none
 * be added) — this satisfies the "modern editor" requirement pragmatically.
 */
export function ContentEditor({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  function replaceSelection(before: string, after: string, placeholder: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    const cursorStart = start + before.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorStart, cursorStart + selected.length);
    });
  }

  function wrapLines(before: string, lineWrap: (line: string) => string, after: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || "List item";
    const wrapped = before + selected.split("\n").map(lineWrap).join("\n") + after;
    const next = value.slice(0, start) + wrapped + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => el.focus());
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const next = value.slice(0, start) + text + value.slice(start);
    onChange(next);
    const cursor = start + text.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  function handleLink() {
    const url = window.prompt("Link URL (https://…)");
    if (!url) return;
    replaceSelection(`<a href="${url}">`, `</a>`, "link text");
  }

  function handleImage() {
    const src = window.prompt("Image URL (https://…)");
    if (!src) return;
    const alt = window.prompt("Alt text (for accessibility)") ?? "";
    insertAtCursor(`<img src="${src}" alt="${alt}" />`);
  }

  const buttons: { label: string; icon: LucideIcon; onClick: () => void }[] = [
    { label: "Bold", icon: Bold, onClick: () => replaceSelection("<strong>", "</strong>", "bold text") },
    { label: "Italic", icon: Italic, onClick: () => replaceSelection("<em>", "</em>", "italic text") },
    { label: "Heading 2", icon: Heading2, onClick: () => replaceSelection("<h2>", "</h2>", "Heading") },
    { label: "Heading 3", icon: Heading3, onClick: () => replaceSelection("<h3>", "</h3>", "Heading") },
    { label: "Link", icon: LinkIcon, onClick: handleLink },
    { label: "Blockquote", icon: Quote, onClick: () => replaceSelection("<blockquote>\n", "\n</blockquote>", "Quoted text") },
    { label: "Bulleted list", icon: List, onClick: () => wrapLines("<ul>\n", (l) => `  <li>${l}</li>`, "\n</ul>") },
    { label: "Numbered list", icon: ListOrdered, onClick: () => wrapLines("<ol>\n", (l) => `  <li>${l}</li>`, "\n</ol>") },
    { label: "Image", icon: ImageIcon, onClick: handleImage },
    { label: "Code block", icon: Code2, onClick: () => replaceSelection("<pre><code>\n", "\n</code></pre>", "code here") },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-input bg-muted/40 p-1.5">
        {buttons.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            type="button"
            title={label}
            onClick={onClick}
            className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="sr-only">{label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className={cn(
            "ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs font-medium",
            preview ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          )}
        >
          {preview ? <Pencil className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div
          className={cn(
            "min-h-[280px] rounded-b-md border border-input bg-background p-4 text-sm",
            "[&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold",
            "[&_p]:my-3 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold",
            "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
            "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6",
            "[&_img]:my-3 [&_img]:rounded-md [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-xs [&_code]:font-mono"
          )}
          dangerouslySetInnerHTML={{ __html: value || "<p class=\"text-muted-foreground\">Nothing to preview yet.</p>" }}
        />
      ) : (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          className="rounded-t-none font-mono text-sm"
          placeholder="<p>Write your post content as HTML…</p>"
        />
      )}
    </div>
  );
}
