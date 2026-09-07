import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn("mt-1 text-2xl font-bold", toneClass)}>{value}</p>
          {trend ? <p className="mt-1 text-xs text-muted-foreground">{trend}</p> : null}
        </div>
        {Icon ? <Icon className="h-5 w-5 text-muted-foreground" aria-hidden /> : null}
      </CardContent>
    </Card>
  );
}
