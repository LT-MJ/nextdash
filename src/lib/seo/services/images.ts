import { db } from "@/lib/server/db";
import { extractImages } from "../content-parser";

export interface ImageIssueRow {
  entityType: string;
  entityId: string;
  title: string;
  src: string;
  issue: "missing-alt" | "empty-alt";
}

/** On-demand image ALT-text scan across post/page/product bodies. Bounded like analyzeInternalLinks. */
export async function analyzeImageSeo(): Promise<{ issues: ImageIssueRow[]; totalImages: number }> {
  const [posts, pages, products] = await Promise.all([
    db.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true, content: true }, take: 500 }),
    db.page.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true, content: true }, take: 500 }),
    db.product.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, description: true }, take: 500 }),
  ]);

  const items = [
    ...posts.map((p) => ({ entityType: "post", entityId: p.id, title: p.title, content: p.content })),
    ...pages.map((p) => ({ entityType: "page", entityId: p.id, title: p.title, content: p.content })),
    ...products.map((p) => ({ entityType: "product", entityId: p.id, title: p.name, content: p.description ?? "" })),
  ];

  const issues: ImageIssueRow[] = [];
  let totalImages = 0;

  for (const item of items) {
    const images = extractImages(item.content);
    totalImages += images.length;
    for (const image of images) {
      if (image.alt === null) {
        issues.push({ entityType: item.entityType, entityId: item.entityId, title: item.title, src: image.src, issue: "missing-alt" });
      } else if (image.alt.trim() === "") {
        issues.push({ entityType: item.entityType, entityId: item.entityId, title: item.title, src: image.src, issue: "empty-alt" });
      }
    }
  }

  return { issues, totalImages };
}
