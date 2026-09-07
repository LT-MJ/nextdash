import { db } from "@/lib/server/db";
import { round2 } from "./money";

export interface CartLineInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface PricedCartLine {
  productId: string;
  variantId: string | null;
  found: boolean;
  /** Product is ACTIVE + PUBLIC and, if a variant was requested, the variant exists on it. */
  purchasable: boolean;
  name: string;
  slug: string | null;
  sku: string | null;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  availableStock: number;
  categoryId: string | null;
}

export interface PricedCart {
  lines: PricedCartLine[];
  subtotal: number;
  productIds: string[];
  categoryIds: string[];
}

/**
 * Re-fetches current price/stock/availability for a set of cart lines
 * directly from the database. This is the ONLY source of truth for what a
 * cart or checkout is allowed to charge — any price/name the client sends
 * alongside these ids is ignored entirely.
 */
export async function priceCartItems(items: CartLineInput[]): Promise<PricedCart> {
  const productIds = [...new Set(items.map((i) => i.productId))];

  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true, inventory: true, category: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const lines: PricedCartLine[] = items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      return {
        productId: item.productId,
        variantId: item.variantId ?? null,
        found: false,
        purchasable: false,
        name: "Unknown product",
        slug: null,
        sku: null,
        image: null,
        price: 0,
        compareAtPrice: null,
        quantity: item.quantity,
        lineTotal: 0,
        availableStock: 0,
        categoryId: null,
      };
    }

    const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) ?? null : null;
    const variantRequestedButMissing = !!item.variantId && !variant;

    const price = variant?.price ?? product.price;
    const compareAtPrice = variant?.compareAtPrice ?? product.compareAtPrice ?? null;
    const images: string[] = product.images ? JSON.parse(product.images) : [];
    const image = variant?.image ?? images[0] ?? null;
    const sku = variant?.sku ?? product.sku ?? null;
    const name = variant ? `${product.name} — ${variant.name}` : product.name;

    const availableStock = variant
      ? product.inventory.filter((inv) => inv.variantId === variant.id).reduce((acc, inv) => acc + inv.stock, 0)
      : product.inventory.filter((inv) => inv.productId === product.id && inv.variantId === null).reduce((acc, inv) => acc + inv.stock, 0);

    const purchasable = product.status === "ACTIVE" && product.visibility === "PUBLIC" && !variantRequestedButMissing;

    return {
      productId: product.id,
      variantId: variant?.id ?? null,
      found: true,
      purchasable,
      name,
      slug: product.slug,
      sku,
      image,
      price,
      compareAtPrice,
      quantity: item.quantity,
      lineTotal: round2(price * item.quantity),
      availableStock,
      categoryId: product.categoryId,
    };
  });

  const subtotal = round2(lines.reduce((acc, l) => acc + l.lineTotal, 0));
  const categoryIds = [...new Set(lines.map((l) => l.categoryId).filter((c): c is string => !!c))];

  return { lines, subtotal, productIds, categoryIds };
}
