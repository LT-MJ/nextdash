import { safeJsonLdStringify } from "@/lib/seo/json-ld";

/**
 * Renders one or more JSON-LD blocks safely. See src/lib/seo/json-ld.ts for
 * the shared escaping logic (also used outside React by the standalone
 * Page renderer).
 */
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
