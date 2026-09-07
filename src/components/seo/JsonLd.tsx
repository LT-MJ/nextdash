/**
 * Renders one or more JSON-LD blocks safely. Escapes characters that could
 * break out of the <script> tag (</script>, <!--, line/paragraph separators)
 * so schema data can never be used to inject markup, even if it originated
 * from user-editable fields (custom schema JSON).
 */
function safeJsonLdStringify(data: Record<string, unknown>): string {
  const LINE_SEPARATOR = String.fromCharCode(0x2028);
  const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

  return JSON.stringify(data)
    .split("<").join("\\u003c")
    .split(">").join("\\u003e")
    .split("&").join("\\u0026")
    .split(LINE_SEPARATOR).join("\\u2028")
    .split(PARAGRAPH_SEPARATOR).join("\\u2029");
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data];
  const valid = items.filter((item) => item && typeof item === "object" && "@type" in item);

  return (
    <>
      {valid.map((item, index) => (
        <script
          key={`${item["@type"]}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(item) }}
        />
      ))}
    </>
  );
}
