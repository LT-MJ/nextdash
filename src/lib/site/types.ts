import type { FooterColumn, SocialLink } from "./validation";

/** Parses the stringified-JSON columns stored on HeaderFooterSettings. */
export function parseFooterColumns(raw: string | null | undefined): FooterColumn[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FooterColumn[]) : [];
  } catch {
    return [];
  }
}

export function parseSocialLinks(raw: string | null | undefined): SocialLink[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SocialLink[]) : [];
  } catch {
    return [];
  }
}
