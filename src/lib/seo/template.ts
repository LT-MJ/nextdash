/**
 * Single source of truth for SEO title/description template variable
 * substitution (spec §7). Do not duplicate {variable} replacement logic
 * elsewhere — always go through `renderTemplate`.
 */
export interface TemplateVariables {
  title?: string | null;
  siteName?: string | null;
  category?: string | null;
  author?: string | null;
  date?: string | null;
  excerpt?: string | null;
  focusKeyword?: string | null;
  sep?: string | null;
}

const VARIABLE_RE = /\{(\w+)\}/g;

export function renderTemplate(template: string, vars: TemplateVariables): string {
  const rendered = template.replace(VARIABLE_RE, (_match, key: string) => {
    const value = vars[key as keyof TemplateVariables];
    return value ?? "";
  });

  return rendered
    .replace(/\s+/g, " ")
    .replace(/\s*([|\-–—:])\s*(?=\1|\s*$|$)/g, "")
    .replace(/^[\s|\-–—:]+|[\s|\-–—:]+$/g, "")
    .trim();
}
