import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";

export async function GET(request: Request) {
  const { error } = await requireApiPermission("ecommerce.reviews");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const reviews = await db.review.findMany({
    where: status ? { status } : {},
    include: { product: true, customer: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ reviews });
}
