"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle, AlertCircle, Circle } from "lucide-react";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";
import { ChecklistItem } from "./ChecklistItem";

type ItemStatus = "PENDING" | "PASSED" | "FAILED" | "NOT_APPLICABLE";
type Severity = "CRITICAL" | "SERIOUS" | "MODERATE" | "MINOR";

interface ChecklistItemData {
  id: string;
  category: string;
  description: string;
  inputType: string;
  status: ItemStatus;
  value?: string | null;
  numericValue?: number | null;
  notes?: string | null;
  photoUrl?: string | null;
  severity?: Severity | null;
}

interface ChecklistCategoryProps {
  category: string;
  items: ChecklistItemData[];
  onItemUpdate: (
    itemId: string,
    updates: {
      status?: ItemStatus;
      value?: string | null;
      numericValue?: number | null;
      notes?: string | null;
      severity?: Severity | null;
    }
  ) => void;
  defaultExpanded?: boolean;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  SAFETY_ACCESS: "Sikkerhet og tilgang",
  SOLAR_PANELS: "Solcellepaneler",
  INVERTERS: "Invertere",
  CABLES_CONNECTIONS: "Kabler og koblinger",
  MOUNTING_STRUCTURE: "Montasje og struktur",
  PERFORMANCE: "Ytelse og dokumentasjon",
  BATTERY: "Batteri",
  ELECTRICAL: "Elektrisk",
  GENERAL: "Generelt",
};

export function ChecklistCategory({
  category,
  items,
  onItemUpdate,
  defaultExpanded = true,
  className,
}: ChecklistCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const completedCount = items.filter(
    (item) => item.status !== "PENDING"
  ).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const hasFailures = items.some((item) => item.status === "FAILED");
  const isComplete = completedCount === totalCount;

  const StatusIcon = isComplete
    ? CheckCircle
    : hasFailures
      ? AlertCircle
      : Circle;

  return (
    <div className={cn("rounded-lg border border-border", className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <StatusIcon
            className={cn(
              "size-5",
              isComplete && "text-success",
              hasFailures && "text-destructive",
              !isComplete && !hasFailures && "text-muted-foreground"
            )}
          />
          <div>
            <h3 className="font-medium">
              {CATEGORY_LABELS[category] ?? category}
            </h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} av {totalCount} fullført
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block w-32">
            <Progress value={progress} className="h-2" />
          </div>
          <ChevronDown
            className={cn(
              "size-5 text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Mobile progress bar */}
      <div className="px-4 pb-2 sm:hidden">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Items */}
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-3">
          {items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onUpdate={(updates) => onItemUpdate(item.id, updates)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
