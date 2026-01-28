"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface KpiCardProps {
  title: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend?: "up" | "down" | "stable";
  format?: "number" | "currency" | "percent";
  className?: string;
}

export function KpiCard({
  title,
  value,
  change,
  changePercent,
  trend,
  format = "number",
  className,
}: KpiCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("nb-NO", {
          style: "currency",
          currency: "NOK",
          maximumFractionDigits: 0,
        }).format(val);
      case "percent":
        return `${val}%`;
      default:
        return new Intl.NumberFormat("nb-NO").format(val);
    }
  };

  const trendColor = trend === "up" 
    ? "text-success" 
    : trend === "down" 
    ? "text-destructive" 
    : "text-muted-foreground";

  const TrendIcon = trend === "up" 
    ? ArrowUp 
    : trend === "down" 
    ? ArrowDown 
    : Minus;

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{formatValue(value)}</p>
          
          {(change !== undefined || changePercent !== undefined) && (
            <div className="flex items-center gap-2 text-sm">
              <div className={cn("flex items-center gap-0.5", trendColor)}>
                <TrendIcon className="size-3.5" />
                <span className="font-medium">
                  {changePercent !== undefined
                    ? `${Math.abs(changePercent).toFixed(1)}%`
                    : change !== undefined
                    ? Math.abs(change)
                    : ""}
                </span>
              </div>
              <span className="text-muted-foreground">vs forrige måned</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// KPI card row component
interface KpiRowProps {
  kpis: Array<KpiCardProps>;
  className?: string;
}

export function KpiRow({ kpis, className }: KpiRowProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {kpis.map((kpi, index) => (
        <KpiCard key={index} {...kpi} />
      ))}
    </div>
  );
}
