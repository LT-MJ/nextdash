/**
 * Framework-agnostic JSON-LD serialization, shared by the React `<JsonLd>`
 * component (src/components/seo/JsonLd.tsx) and anything that needs to
 * build raw HTML outside the React tree (src/lib/seo/services/page-renderer.ts
 * — Next.js disallows importing `react-dom/server` into app code, so that
 * renderer can't just render the React component to a string). Keeping the
 * escaping logic here means both call sites stay byte-for-byte identical.
 *
 * Escapes characters that could break out of the <script> tag (</script>,
 * <!--, line/paragraph separators) so schema data can never be used to
 * inject markup, even if it originated from a user-editable field (custom
 * schema JSON).
 */
export function safeJsonLdStringify(data: Record<string, unknown>): string {
  const LINE_SEPARATOR = String.fromCharCode(0x2028);
  const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

  return JSON.stringify(data)
    .split("<").join("\\u003c")
    .split(">").join("\\u003e")
    .split("&").join("\\u0026")
    .split(LINE_SEPARATOR).join("\\u2028")
    .split(PARAGRAPH_SEPARATOR).join("\\u2029");
}

function isValidJsonLdItem(item: unknown): item is Record<string, unknown> {
  return Boolean(item) && typeof item === "object" && "@type" in (item as Record<string, unknown>);
}

/** Builds raw `<script type="application/ld+json">` tag(s) as an HTML string. */
export function renderJsonLdTags(data: Record<string, unknown> | Record<string, unknown>[]): string {
  const items = Array.isArray(data) ? data : [data];
  return items
    .filter(isValidJsonLdItem)
    .map((item) => `<script type="application/ld+json">${safeJsonLdStringify(item)}</script>`)
    .join("\n");
}

export function isValidJsonLdData(data: unknown): boolean {
  return Array.isArray(data) ? data.some(isValidJsonLdItem) : isValidJsonLdItem(data);
}
