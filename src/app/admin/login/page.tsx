import { Suspense } from "react";
import { LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoginForm } from "@/components/admin/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <LayoutGrid className="mb-2 h-8 w-8 text-primary" aria-hidden />
          <CardTitle className="text-xl">Sign in to Nextdash</CardTitle>
          <CardDescription>SEO, content, and commerce management</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
