"use client";

import { Check, Clock, Play, CheckCircle, XCircle } from "lucide-react";
import { cn } from "~/lib/utils";

type VisitStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "BLOCKED";

interface VisitStatusFlowProps {
  currentStatus: VisitStatus;
  className?: string;
}

const STATUSES: Array<{
  key: VisitStatus;
  label: string;
  icon: React.ReactNode;
}> = [
  { key: "SCHEDULED", label: "Planlagt", icon: <Clock className="size-4" /> },
  { key: "IN_PROGRESS", label: "Pågår", icon: <Play className="size-4" /> },
  { key: "COMPLETED", label: "Fullført", icon: <CheckCircle className="size-4" /> },
];

const STATUS_ORDER: Record<VisitStatus, number> = {
  SCHEDULED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: -1,
  BLOCKED: -1,
};

export function VisitStatusFlow({ currentStatus, className }: VisitStatusFlowProps) {
  const currentIndex = STATUS_ORDER[currentStatus];
  const isCancelled = currentStatus === "CANCELLED" || currentStatus === "BLOCKED";

  if (isCancelled) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="size-5" />
          <span className="font-medium">
            {currentStatus === "CANCELLED" ? "Kansellert" : "Blokkert"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      {STATUSES.map((status, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={status.key} className="flex items-center">
            {/* Step */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-background text-primary",
                  isPending && "border-muted bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="size-4" /> : status.icon}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  isCompleted && "text-primary",
                  isCurrent && "text-foreground",
                  isPending && "text-muted-foreground"
                )}
              >
                {status.label}
              </span>
            </div>

            {/* Connector */}
            {index < STATUSES.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-12 mx-2",
                  index < currentIndex ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
