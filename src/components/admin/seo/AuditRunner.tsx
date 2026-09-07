"use client";

import { useState } from "react";
import useSWR from "swr";
import { ClipboardCheck, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AuditRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  totalUrls: number;
  issuesFound: number;
}

interface AuditIssue {
  id: string;
  entityType: string;
  entityId: string;
  url: string;
  category: string;
  severity: string;
  ruleKey: string;
  message: string;
}

function IssueList({ runId }: { runId: string }) {
  const { data } = useSWR<{ run: AuditRun & { issues: AuditIssue[] } }>(`/api/admin/seo/audit/${runId}`, fetcher);
  if (!data) return <p className="p-3 text-sm text-muted-foreground">Loading issues…</p>;
  if (data.run.issues.length === 0) return <p className="p-3 text-sm text-muted-foreground">No issues recorded for this run.</p>;
  return (
    <ul className="divide-y divide-border">
      {data.run.issues.map((issue) => (
        <li key={issue.id} className="flex items-start justify-between gap-3 p-3 text-sm">
          <div>
            <p>{issue.message}</p>
            <p className="text-xs text-muted-foreground">{issue.url}</p>
          </div>
          <Badge variant={issue.severity === "HIGH" ? "destructive" : issue.severity === "MEDIUM" ? "warning" : "outline"}>{issue.severity}</Badge>
        </li>
      ))}
    </ul>
  );
}

export function AuditRunner() {
  const { data, mutate, isLoading } = useSWR<{ runs: AuditRun[] }>("/api/admin/seo/audit", fetcher);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    await fetch("/api/admin/seo/audit", { method: "POST" });
    setRunning(false);
    mutate();
  }

  const runs = data?.runs ?? [];

  return (
    <div className="space-y-4">
      <Button onClick={handleRun} disabled={running}>
        {running ? "Running audit…" : "Run site audit"}
      </Button>

      {!isLoading && runs.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No audits have been run yet." description="Run a site audit to surface critical issues, duplicate metadata, and orphan pages." />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {runs.map((run) => (
            <div key={run.id}>
              <button
                onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm hover:bg-muted/40"
              >
                <span className="flex items-center gap-2">
                  {expanded === run.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {formatDateTime(run.startedAt)}
                </span>
                <span className="flex items-center gap-3 text-muted-foreground">
                  <span>{run.totalUrls} analyzed</span>
                  <Badge variant={run.issuesFound > 0 ? "warning" : "success"}>{run.issuesFound} issues</Badge>
                </span>
              </button>
              {expanded === run.id ? <IssueList runId={run.id} /> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
