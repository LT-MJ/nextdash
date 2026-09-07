import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ results: [] }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const permissions = session.user.permissions;
  const canSeeBlog = permissions.includes("blog.view");
  const canSeeCommerce = permissions.includes("ecommerce.view");
  const canSeeSeo = permissions.includes("seo.view");

  const [posts, products, pages, orders] = await Promise.all([
    canSeeBlog
      ? db.blogPost.findMany({
          where: { OR: [{ title: { contains: q } }, { slug: { contains: q } }] },
          take: 6,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    canSeeCommerce
      ? db.product.findMany({
          where: { OR: [{ name: { contains: q } }, { sku: { contains: q } }, { slug: { contains: q } }] },
          take: 6,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    canSeeSeo
      ? db.page.findMany({
          where: { OR: [{ title: { contains: q } }, { slug: { contains: q } }] },
          take: 6,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    canSeeCommerce
      ? db.order.findMany({
          where: { orderNumber: { contains: q } },
          take: 6,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const results = [
    ...posts.map((p) => ({ type: "post" as const, id: p.id, title: p.title, href: `/admin/blog/posts/${p.id}`, status: p.status })),
    ...products.map((p) => ({ type: "product" as const, id: p.id, title: p.name, href: `/admin/ecommerce/products/${p.id}`, status: p.status })),
    ...pages.map((p) => ({ type: "page" as const, id: p.id, title: p.title, href: `/admin/seo/content?entityType=page&search=${p.slug}`, status: p.status })),
    ...orders.map((o) => ({ type: "order" as const, id: o.id, title: o.orderNumber, href: `/admin/ecommerce/orders/${o.id}`, status: o.status })),
  ];

  return NextResponse.json({ results });
}
