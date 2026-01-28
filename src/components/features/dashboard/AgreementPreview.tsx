"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { SegmentedProgress } from "~/components/ui/progress";
import { Sparkles, FileText } from "lucide-react";
import { cn } from "~/lib/utils";

interface SpendingCategory {
  label: string;
  value: number;
  color: string;
}

interface AgreementPreviewProps {
  className?: string;
}

export function AgreementPreview({ className }: AgreementPreviewProps) {
  // Sample spending limits data (as per design brief)
  const totalBudget = 4815.23;
  const categories: SpendingCategory[] = [
    { label: "Vedlikehold", value: 27, color: "#FBD11E" },
    { label: "Reise", value: 18, color: "#60A5FA" },
    { label: "Materialer", value: 35, color: "#22C55E" },
    { label: "Annet", value: 20, color: "#94A3B8" },
  ];

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              AI-anbefalinger
            </CardTitle>
          </div>
        </div>
        <p className="mt-2 text-2xl font-bold">
          kr {totalBudget.toLocaleString("nb-NO")}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {/* Spending limits section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Budsjettfordeling</h4>
          
          {/* Segmented progress bar */}
          <SegmentedProgress
            segments={categories.map((c) => ({
              value: c.value,
              color: c.color,
              label: c.label,
            }))}
          />
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <div key={category.label} className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {category.label}
                </span>
                <span className="ml-auto text-xs font-medium">
                  {category.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Agreement Card (like the payment card in the design) */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-4">
          {/* Glow effect */}
          <div className="absolute -left-4 -top-4 size-24 rounded-full bg-primary/30 blur-2xl" />
          
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <FileText className="size-8 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                PREMIUM
              </span>
            </div>
            
            <div className="space-y-1">
              <p className="text-lg font-mono tracking-wider">
                SA-2024-ABC123
              </p>
              <p className="text-sm text-muted-foreground">
                Solgård Borettslag
              </p>
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Fornyes</p>
                <p className="text-sm font-medium">31.12.2024</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Verdi</p>
                <p className="text-sm font-medium">kr 45 000</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
