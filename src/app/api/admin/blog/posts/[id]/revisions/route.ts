import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthorizedSession } from "@/lib/blog/api-auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthorizedSession("blog.view");
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const revisions = await db.blogPostRevision.findMany({
    where: { postId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const authorIds = [...new Set(revisions.map((r) => r.authorId).filter((v): v is string => !!v))];
  const users = authorIds.length > 0 ? await db.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true } }) : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return NextResponse.json({
    revisions: revisions.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      changedFields: r.changedFields ? (JSON.parse(r.changedFields) as string[]) : [],
      authorName: r.authorId ? nameById.get(r.authorId) ?? "Unknown user" : "System",
    })),
  });
}
