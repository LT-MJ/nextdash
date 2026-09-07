import { Plus, Percent } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/admin/ecommerce/DeleteButton";
import { CouponFormDialog } from "@/components/admin/ecommerce/CouponFormDialog";
import { formatDate } from "@/lib/utils";

export default async function CouponsPage() {
  await requirePermission("ecommerce.coupons");
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="text-sm text-muted-foreground">Discount codes for the storefront checkout.</p>
        </div>
        <CouponFormDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> New Coupon
            </Button>
          }
        />
      </div>

      {coupons.length === 0 ? (
        <EmptyState icon={Percent} title="No coupons have been created yet." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                <TableCell>{coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}</TableCell>
                <TableCell>
                  {coupon.usedCount}
                  {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {coupon.startsAt ? formatDate(coupon.startsAt) : "Any time"} &rarr; {coupon.endsAt ? formatDate(coupon.endsAt) : "No end"}
                </TableCell>
                <TableCell>
                  <Badge variant={coupon.active ? "success" : "muted"}>{coupon.active ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <CouponFormDialog
                      initial={coupon}
                      trigger={
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      }
                    />
                    <DeleteButton url={`/api/admin/ecommerce/coupons/${coupon.id}`} confirmText={`Delete coupon "${coupon.code}"?`} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
