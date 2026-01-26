"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-muted",
  {
    variants: {
      size: {
        sm: "h-1.5",
        default: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const progressIndicatorVariants = cva(
  "h-full transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        danger: "bg-destructive",
        info: "bg-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressIndicatorVariants> {
  value?: number;
  max?: number;
  showValue?: boolean;
}

function Progress({
  className,
  value = 0,
  max = 100,
  size,
  variant,
  showValue,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(progressVariants({ size }))}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        {...props}
      >
        <div
          className={cn(
            progressIndicatorVariants({ variant }),
            "rounded-full"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

interface ProgressSegment {
  value: number;
  color: string;
  label?: string;
}

interface SegmentedProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  segments: ProgressSegment[];
  showLegend?: boolean;
}

function SegmentedProgress({
  className,
  segments,
  size,
  showLegend,
  ...props
}: SegmentedProgressProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(progressVariants({ size }), "flex overflow-hidden")}
        role="progressbar"
        {...props}
      >
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          return (
            <div
              key={index}
              className="h-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: segment.color,
              }}
            />
          );
        })}
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-4">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-muted-foreground">
                {segment.label ?? `Segment ${index + 1}`}
              </span>
              <span className="text-xs font-medium tabular-nums">
                {Math.round((segment.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { Progress, SegmentedProgress, progressVariants, progressIndicatorVariants };
