import { requirePermission } from "@/lib/auth/guard";
import { db } from "@/lib/server/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { Cog } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "destructive" | "outline" | "muted"> = {
  COMPLETED: "success",
  FAILED: "destructive",
  RUNNING: "outline",
  QUEUED: "muted",
  CANCELLED: "muted",
};

export default async function JobsPage() {
  await requirePermission("system.jobs");
  const jobs = await db.backgroundJob.findMany({ orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Background Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Scheduled maintenance runs (IndexNow queue processing, data retention pruning). Trigger via{" "}
          <code className="rounded bg-muted px-1">POST /api/cron</code> with a <code className="rounded bg-muted px-1">CRON_SECRET</code>{" "}
          bearer token from an external scheduler — see docs/scheduled-jobs.md.
        </p>
      </div>

      {jobs.length === 0 ? (
        <EmptyState icon={Cog} title="No background jobs have run yet." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Finished</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-xs">{job.type}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[job.status] ?? "outline"}>{job.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(job.startedAt)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(job.finishedAt)}</TableCell>
                <TableCell className="max-w-xs truncate text-xs text-destructive">{job.errorMessage}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
