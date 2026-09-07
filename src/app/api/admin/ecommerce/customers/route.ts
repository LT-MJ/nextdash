import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { requireApiPermission } from "@/lib/ecommerce/api-auth";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { error } = await requireApiPermission("ecommerce.customers");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = 20;
  const search = searchParams.get("search")?.trim();

  const where: Prisma.CustomerWhereInput = search
    ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] }
    : {};

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, pageSize });
}
