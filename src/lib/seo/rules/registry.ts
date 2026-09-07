import type { SeoRule } from "@/types/seo";

/**
 * Extensible rule registry. Core rules register themselves via
 * `builtin.ts`; a host application can add its own rules at startup with
 * `registerSeoRule(...)` without touching the analyzer (spec §84/§85).
 */
const registry = new Map<string, SeoRule>();

export function registerSeoRule(rule: SeoRule): void {
  registry.set(rule.key, rule);
}

export function getRegisteredRules(): SeoRule[] {
  return [...registry.values()];
}

export function getRule(key: string): SeoRule | undefined {
  return registry.get(key);
}
