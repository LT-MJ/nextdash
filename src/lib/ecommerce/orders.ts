import { randomBytes } from "crypto";

/** e.g. "ORD-20260907-3F9A1C" — date-scoped with a random suffix to avoid collisions. */
export function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return `ORD-${datePart}-${rand}`;
}
