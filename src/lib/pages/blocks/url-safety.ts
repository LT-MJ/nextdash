/**
 * Allowlists URL schemes safe to emit in an `href`/`src` attribute. Used
 * both when saving a block document (reject at input time) and again in
 * the public string renderer (defense in depth against any stored data
 * that predates this check or slips through a future bug).
 */
export function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return false;
  if (trimmed.startsWith("/") || trimmed.startsWith("#") || trimmed.startsWith("?")) return true;

  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!schemeMatch) {
    // No scheme and doesn't start with a safe relative prefix — e.g. "example.com".
    // Treat as a relative URL rather than rejecting outright.
    return !/^[a-z0-9+.-]*:/i.test(trimmed);
  }
  const scheme = schemeMatch[1].toLowerCase();
  return scheme === "http" || scheme === "https" || scheme === "mailto" || scheme === "tel";
}
