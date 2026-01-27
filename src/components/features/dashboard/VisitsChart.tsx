"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Plus, MoreHorizontal } from "lucide-react";

interface ChartData {
  month: string;
  visits: number;
  target?: number;
}

interface VisitsChartProps {
  data: ChartData[];
  title?: string;
  className?: string;
  highlightMonth?: number; // Index of month to highlight
}

export function VisitsChart({
  data,
  title = "Servicebesøk fullført",
  className,
  highlightMonth,
}: VisitsChartProps) {
  const [viewType, setViewType] = useState<"bar" | "line">("bar");
  
  const maxValue = Math.max(...data.map((d) => Math.max(d.visits, d.target ?? 0)));
  const currentIndex = highlightMonth ?? data.length - 1;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <p className="mt-1 text-2xl font-bold">
            {data.reduce((sum, d) => sum + d.visits, 0)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">totalt</span>
          </p>
        </div>
        <CardAction className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setViewType("bar")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                viewType === "bar"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Stolpe
            </button>
            <button
              onClick={() => setViewType("line")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                viewType === "line"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Linje
            </button>
          </div>
          
          {/* Actions */}
          <Button size="sm" className="hidden sm:flex">
            <Plus className="mr-1 size-4" />
            Nytt besøk
          </Button>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Chart */}
        <div className="relative h-48">
          {viewType === "bar" ? (
            <div className="flex h-full items-end justify-between gap-2">
              {data.map((item, index) => {
                const height = (item.visits / maxValue) * 100;
                const isHighlighted = index === currentIndex;
                
                return (
                  <div
                    key={item.month}
                    className="group relative flex flex-1 flex-col items-center"
                  >
                    {/* Bar */}
                    <div className="relative w-full flex-1">
                      <div
                        className={cn(
                          "absolute bottom-0 w-full rounded-t-sm transition-all",
                          isHighlighted
                            ? "bg-primary"
                            : "bg-muted-foreground/10 group-hover:bg-muted-foreground/20"
                        )}
                        style={{ height: `${height}%` }}
                      />
                      
                      {/* Tooltip on hover */}
                      <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        {item.visits} besøk
                      </div>
                    </div>
                    
                    {/* Label */}
                    <span
                      className={cn(
                        "mt-2 text-xs",
                        isHighlighted
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            // Simple line chart placeholder
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Linjediagram kommer snart
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-4 flex items-center gap-4 border-t pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" />
            <span>Denne måneden</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-muted-foreground/20" />
            <span>Tidligere måneder</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
