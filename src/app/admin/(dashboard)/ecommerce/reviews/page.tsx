import Link from "next/link";
import { Star } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListFilters } from "@/components/admin/ecommerce/ListFilters";
import { ReviewActions } from "@/components/admin/ecommerce/ReviewActions";
import { formatDate } from "@/lib/utils";

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePermission("ecommerce.reviews");
  const { status } = await searchParams;

  const reviews = await db.review.findMany({
    where: status ? { status } : {},
    include: { product: true, customer: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">Moderate customer product reviews.</p>
      </div>

      <ListFilters
        showSearch={false}
        selects={[
          {
            key: "status",
            label: "Status",
            options: ["PENDING", "APPROVED", "REJECTED", "SPAM"].map((s) => ({ value: s, label: s })),
          },
        ]}
      />

      {reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews to show." description="Reviews submitted for products will appear here for moderation." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <Link href={`/admin/ecommerce/products/${review.productId}`} className="font-medium text-primary hover:underline">
                    {review.product.name}
                  </Link>
                </TableCell>
                <TableCell>{review.authorName}</TableCell>
                <TableCell>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</TableCell>
                <TableCell className="max-w-xs">
                  {review.title ? <p className="font-medium">{review.title}</p> : null}
                  <p className="truncate text-sm text-muted-foreground">{review.content}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={review.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(review.createdAt)}</TableCell>
                <TableCell>
                  <ReviewActions reviewId={review.id} status={review.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
