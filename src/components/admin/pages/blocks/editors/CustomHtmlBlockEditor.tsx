"use client";

import { ContentEditor } from "@/components/admin/ContentEditor";
import type { CustomHtmlBlockData } from "@/lib/pages/blocks/types";

export function CustomHtmlBlockEditor({ data, onChange }: { data: CustomHtmlBlockData; onChange: (next: CustomHtmlBlockData) => void }) {
  return <ContentEditor value={data.html} onChange={(html) => onChange({ html })} />;
}
