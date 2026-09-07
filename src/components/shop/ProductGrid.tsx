import { PackageSearch } from "lucide-react";
import { ProductCard, type ProductCardData } from "./ProductCard";

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
        <PackageSearch className="mb-2 h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">No products found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
