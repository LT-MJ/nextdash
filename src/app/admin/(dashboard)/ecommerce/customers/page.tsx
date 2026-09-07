import Link from "next/link";
import { Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ListFilters } from "@/components/admin/ecommerce/ListFilters";
import { Pagination } from "@/components/admin/ecommerce/Pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string }> }) {
  await requirePermission("ecommerce.customers");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const search = sp.search?.trim();

  const where: Prisma.CustomerWhereInput = search ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] } : {};

  const [customers, total] = await Promise.all([
    db.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.customer.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">Everyone who has placed an order.</p>
      </div>

      <ListFilters searchPlaceholder="Search by name or email…" selects={[]} />

      {customers.length === 0 ? (
        <EmptyState icon={Users} title="No customers yet." description="Customers are created automatically when an order is placed." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Lifetime value</TableHead>
                <TableHead>Last order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link href={`/admin/ecommerce/customers/${customer.id}`} className="font-medium text-primary hover:underline">
                      {customer.name ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                  <TableCell>{customer.ordersCount}</TableCell>
                  <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(customer.lastOrderAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/ecommerce/customers" searchParams={{ search }} />
        </>
      )}
    </div>
  );
}
