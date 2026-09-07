import { requirePermission } from "@/lib/auth/guard";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default async function SeoAnalyticsPage() {
  await requirePermission("seo.analytics");
  const gscConfigured = Boolean(process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID && process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET);
  const gaConfigured = Boolean(process.env.GOOGLE_ANALYTICS_PROPERTY_ID);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Search Console and Analytics performance, once connected.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Google Search Console</CardTitle>
            <CardDescription>Clicks, impressions, CTR, average position, top queries and pages.</CardDescription>
          </CardHeader>
          <CardContent>
            {gscConfigured ? (
              <p className="text-sm text-muted-foreground">Credentials detected, but the reporting client is not yet wired up in this build.</p>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Connect Google Search Console to see search performance."
                description="Set GOOGLE_SEARCH_CONSOLE_CLIENT_ID and GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET in your environment, then implement the OAuth callback and Search Analytics API client server-side — never expose these credentials to the browser."
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Google Analytics</CardTitle>
            <CardDescription>Organic traffic, sessions, and conversions by content type.</CardDescription>
          </CardHeader>
          <CardContent>
            {gaConfigured ? (
              <p className="text-sm text-muted-foreground">Property ID detected, but the reporting client is not yet wired up in this build.</p>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Connect Google Analytics to see traffic data."
                description="Set GOOGLE_ANALYTICS_PROPERTY_ID and a service-account credential in your environment, then implement the GA4 Data API client server-side."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
