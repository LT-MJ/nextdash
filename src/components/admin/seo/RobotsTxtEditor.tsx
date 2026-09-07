"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function validateRobotsTxt(content: string): string[] {
  const errors: string[] = [];
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  let sawUserAgent = false;
  for (const line of lines) {
    if (line.startsWith("#")) continue;
    const [directive] = line.split(":");
    const normalized = directive?.trim().toLowerCase();
    if (normalized === "user-agent") sawUserAgent = true;
    else if (!["allow", "disallow", "sitemap", "crawl-delay"].includes(normalized ?? "")) {
      errors.push(`Unrecognized directive: "${directive}"`);
    }
  }
  if (lines.length > 0 && !sawUserAgent) errors.push('No "User-agent" directive found.');
  return errors;
}

export function RobotsTxtEditor() {
  const { data, mutate, isLoading } = useSWR<{ settings: { content: string } }>("/api/admin/seo/settings?kind=robots", fetcher);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data?.settings) setContent(data.settings.content);
  }, [data]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const errors = validateRobotsTxt(content);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/seo/settings?kind=robots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setMessage(res.ok ? "Saved." : "Failed to save.");
    mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <Textarea rows={14} className="font-mono text-sm" value={content} onChange={(e) => setContent(e.target.value)} />
      {errors.length > 0 ? (
        <ul className="space-y-1 text-sm text-warning-foreground">
          {errors.map((err) => (
            <li key={err}>⚠ {err}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-success">Looks valid.</p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit">Save robots.txt</Button>
        {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
        <a href="/robots.txt" target="_blank" rel="noreferrer" className="text-sm text-primary underline">
          View live /robots.txt
        </a>
      </div>
    </form>
  );
}
