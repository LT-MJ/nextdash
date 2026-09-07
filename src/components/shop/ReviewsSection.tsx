import { Star } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface ReviewData {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  content: string | null;
  createdAt: Date;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

export function ReviewsSection({ reviews }: { reviews: ReviewData[] }) {
  const average = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {average !== null ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <StarRow rating={Math.round(average)} /> {average.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? "" : "s"})
          </span>
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-border p-4">
              <div className="mb-1 flex items-center justify-between">
                <StarRow rating={review.rating} />
                <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
              </div>
              {review.title ? <p className="font-medium">{review.title}</p> : null}
              {review.content ? <p className="mt-1 text-sm text-muted-foreground">{review.content}</p> : null}
              <p className="mt-2 text-xs font-medium">{review.authorName}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
