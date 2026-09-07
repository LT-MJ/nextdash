import { db } from "@/lib/server/db";
import { extractLinks } from "../content-parser";

export interface LinkAnalysisRow {
  entityType: string;
  entityId: string;
  title: string;
  path: string;
  incomingLinks: number;
  outgoingInternalLinks: number;
  outgoingExternalLinks: number;
}

/**
 * On-demand internal-link analysis across posts and pages. Bounded to 500
 * items per content type so this stays safe to run inline from an admin
 * page; at real scale (spec §56/§86, 100k+ URLs) this belongs in a
 * scheduled background job that persists results instead of recomputing
 * on every request.
 */
export async function analyzeInternalLinks(): Promise<{ rows: LinkAnalysisRow[]; orphanCount: number }> {
  const [posts, pages] = await Promise.all([
    db.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true, slug: true, content: true }, take: 500 }),
    db.page.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true, slug: true, content: true }, take: 500 }),
  ]);

  const items = [
    ...posts.map((p) => ({ entityType: "post", entityId: p.id, title: p.title, path: `/blog/${p.slug}`, content: p.content })),
    ...pages.map((p) => ({ entityType: "page", entityId: p.id, title: p.title, path: `/${p.slug}`, content: p.content })),
  ];

  const incomingCounts = new Map<string, number>();
  const outgoingCounts = new Map<string, { internal: number; external: number }>();

  for (const item of items) {
    const links = extractLinks(item.content);
    const internal = links.filter((l) => l.internal);
    const external = links.filter((l) => !l.internal);
    outgoingCounts.set(item.entityId, { internal: internal.length, external: external.length });
    for (const link of internal) {
      const normalizedPath = link.href.split("#")[0].split("?")[0];
      incomingCounts.set(normalizedPath, (incomingCounts.get(normalizedPath) ?? 0) + 1);
    }
  }

  const rows: LinkAnalysisRow[] = items.map((item) => {
    const outgoing = outgoingCounts.get(item.entityId) ?? { internal: 0, external: 0 };
    return {
      entityType: item.entityType,
      entityId: item.entityId,
      title: item.title,
      path: item.path,
      incomingLinks: incomingCounts.get(item.path) ?? 0,
      outgoingInternalLinks: outgoing.internal,
      outgoingExternalLinks: outgoing.external,
    };
  });

  const orphanCount = rows.filter((r) => r.incomingLinks === 0).length;
  return { rows, orphanCount };
}
