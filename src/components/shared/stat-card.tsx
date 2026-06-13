import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("gap-0 py-5", className)}>
      <CardContent className="space-y-2 px-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {trend ? (
            <span
              className={cn(
                "text-xs font-medium",
                trend.direction === "up" && "text-emerald-600 dark:text-emerald-400",
                trend.direction === "down" && "text-red-600 dark:text-red-400",
                trend.direction === "neutral" && "text-muted-foreground",
              )}
            >
              {trend.value}
            </span>
          ) : null}
        </div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
