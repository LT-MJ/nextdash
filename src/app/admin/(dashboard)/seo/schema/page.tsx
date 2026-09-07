import { requirePermission } from "@/lib/auth/guard";
import { getAllContentTypeSettings } from "@/lib/seo/services/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const REGISTERED_SCHEMA_TYPES = ["Organization", "WebSite", "WebPage", "Article", "Product", "BreadcrumbList", "LocalBusiness", "FAQPage", "Person"];

export default async function SchemaOverviewPage() {
  await requirePermission("seo.settings");
  const contentTypeSettings = await getAllContentTypeSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schema</h1>
        <p className="text-sm text-muted-foreground">
          Structured-data (JSON-LD) generators registered in this platform, and the default schema type applied to each content type.
          Per-item overrides (including fully custom JSON-LD) are set on that item&apos;s SEO editor, Advanced tab.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered generators</CardTitle>
          <CardDescription>Available via the schema registry (src/lib/seo/schema/generators.ts).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {REGISTERED_SCHEMA_TYPES.map((type) => (
            <Badge key={type} variant="outline">
              {type}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content-type defaults</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border text-sm">
            {contentTypeSettings.map((ct) => (
              <li key={ct.contentType} className="flex items-center justify-between py-2">
                <span>{ct.label}</span>
                <Badge variant={ct.schemaTypeDefault ? "success" : "muted"}>{ct.schemaTypeDefault ?? "None configured"}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
