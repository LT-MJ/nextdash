import { cache } from "react";
import { db } from "@/lib/server/db";

/**
 * Settings-singleton accessors for site-wide chrome, mirroring
 * src/lib/seo/services/settings.ts's getX()/updateX() + cache()/upsert
 * pattern.
 */

export const getReadingSettings = cache(async () => {
  const settings = await db.readingSettings.findUnique({ where: { id: "default" } });
  if (settings) return settings;
  return db.readingSettings.create({ data: { id: "default" } });
});

export async function updateReadingSettings(data: Record<string, unknown>) {
  return db.readingSettings.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
}

export const getHeaderFooterSettings = cache(async () => {
  const settings = await db.headerFooterSettings.findUnique({ where: { id: "default" } });
  if (settings) return settings;
  return db.headerFooterSettings.create({ data: { id: "default" } });
});

export async function updateHeaderFooterSettings(data: Record<string, unknown>) {
  return db.headerFooterSettings.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
}
