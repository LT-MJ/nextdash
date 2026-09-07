import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export interface ProductCardData {
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  image: string | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link href={`/shop/${product.slug}`} className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-semibold">{formatCurrency(product.price, product.currency)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.compareAtPrice, product.currency)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
