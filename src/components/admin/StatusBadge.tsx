import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "muted"> = {
  DRAFT: "muted",
  REVIEW: "warning",
  SCHEDULED: "outline",
  PUBLISHED: "success",
  ARCHIVED: "muted",
  ACTIVE: "success",
  OUT_OF_STOCK: "destructive",
  PENDING: "warning",
  PAID: "success",
  PROCESSING: "outline",
  SHIPPED: "outline",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "muted",
  APPROVED: "success",
  REJECTED: "destructive",
  SPAM: "destructive",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANTS[status] ?? "secondary";
  return (
    <Badge variant={variant} className="capitalize">
      {status.toLowerCase().replace(/_/g, " ")}
    </Badge>
  );
}
