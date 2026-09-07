import { db } from "@/lib/server/db";
import { getContentAdapter } from "../content-registry";
import type { ContentTypeKey } from "@/types/seo";

export interface DuplicateGroup {
  field: "title" | "description" | "canonicalUrl";
  value: string;
  entries: { entityType: string; entityId: string; label: string; path: string | null }[];
}

async function labelFor(entityType: string, entityId: string) {
  const adapter = getContentAdapter(entityType as ContentTypeKey);
  if (!adapter) return { label: entityId, path: null };
  const [label, path] = await Promise.all([adapter.getTitle(entityId), adapter.buildPath(entityId)]);
  return { label: label ?? entityId, path };
}

async function buildGroups(field: "title" | "description" | "canonicalUrl", values: string[]): Promise<DuplicateGroup[]> {
  const groups: DuplicateGroup[] = [];
  for (const value of values) {
    const records = await db.seoMetadata.findMany({ where: { [field]: value }, select: { entityType: true, entityId: true } });
    const entries = await Promise.all(
      records.map(async (r) => {
        const { label, path } = await labelFor(r.entityType, r.entityId);
        return { entityType: r.entityType, entityId: r.entityId, label, path };
      })
    );
    groups.push({ field, value, entries });
  }
  return groups;
}

async function findDuplicateTitles(): Promise<DuplicateGroup[]> {
  const grouped = await db.seoMetadata.groupBy({
    by: ["title"],
    where: { title: { not: null } },
    _count: { title: true },
    having: { title: { _count: { gt: 1 } } },
  });
  return buildGroups("title", grouped.map((g) => g.title).filter((v): v is string => Boolean(v)));
}

async function findDuplicateDescriptions(): Promise<DuplicateGroup[]> {
  const grouped = await db.seoMetadata.groupBy({
    by: ["description"],
    where: { description: { not: null } },
    _count: { description: true },
    having: { description: { _count: { gt: 1 } } },
  });
  return buildGroups("description", grouped.map((g) => g.description).filter((v): v is string => Boolean(v)));
}

async function findDuplicateCanonicals(): Promise<DuplicateGroup[]> {
  const grouped = await db.seoMetadata.groupBy({
    by: ["canonicalUrl"],
    where: { canonicalUrl: { not: null } },
    _count: { canonicalUrl: true },
    having: { canonicalUrl: { _count: { gt: 1 } } },
  });
  return buildGroups("canonicalUrl", grouped.map((g) => g.canonicalUrl).filter((v): v is string => Boolean(v)));
}

export async function findAllDuplicateMetadata(): Promise<DuplicateGroup[]> {
  const [titles, descriptions, canonicals] = await Promise.all([
    findDuplicateTitles(),
    findDuplicateDescriptions(),
    findDuplicateCanonicals(),
  ]);
  return [...titles, ...descriptions, ...canonicals];
}
