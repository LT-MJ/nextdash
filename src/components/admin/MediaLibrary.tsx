"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Asset {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  alt: string | null;
  createdAt: string;
}

export function MediaLibrary() {
  const { data, mutate, isLoading } = useSWR<{ assets: Asset[] }>("/api/admin/media", fetcher);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Upload failed.");
    } else {
      mutate();
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    mutate();
  }

  const assets = data?.assets ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild disabled={uploading}>
          <label className="cursor-pointer">
            <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload image"}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </Button>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>

      {!isLoading && assets.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No media uploaded yet." description="Upload images to use as featured images, product photos, and Open Graph images." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {assets.map((asset) => (
            <div key={asset.id} className="group relative overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.url} alt={asset.alt ?? ""} className="aspect-square w-full object-cover" />
              <div className="p-2">
                <p className="truncate text-xs font-medium">{asset.filename}</p>
                <p className="text-[10px] text-muted-foreground">{formatDateTime(asset.createdAt)}</p>
              </div>
              <button
                onClick={() => handleDelete(asset.id)}
                aria-label={`Delete ${asset.filename}`}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
