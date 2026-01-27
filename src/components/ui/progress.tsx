"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-primary/20",
  {
    variants: {
      size: {
        sm: "h-1.5",
        default: "h-2.5",
        lg: "h-4",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const indicatorVariants = cva(
  "h-full transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        info: "bg-info",
        destructive: "bg-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof indicatorVariants> {}

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, size, variant, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ size }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(indicatorVariants({ variant }), "rounded-full")}
      style={{ width: `${value ?? 0}%` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

// Labeled progress bar
interface LabeledProgressProps extends ProgressProps {
  label: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
}

function LabeledProgress({
  label,
  value = 0,
  showValue = true,
  valueFormatter = (v) => `${v}%`,
  className,
  ...props
}: LabeledProgressProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        {showValue && (
          <span className="font-medium">{valueFormatter(value)}</span>
        )}
      </div>
      <Progress value={value} {...props} />
    </div>
  );
}

// Segmented progress (multiple sections with different colors)
interface ProgressSegment {
  value: number;
  color: string;
  label?: string;
}

interface SegmentedProgressProps {
  segments: ProgressSegment[];
  size?: "sm" | "default" | "lg";
  className?: string;
}

function SegmentedProgress({ segments, size = "default", className }: SegmentedProgressProps) {
  const total = segments.reduce((acc, segment) => acc + segment.value, 0);

  return (
    <div className={cn(progressVariants({ size }), "flex", className)}>
      {segments.map((segment, index) => (
        <div
          key={index}
          className={cn(
            "h-full transition-all duration-300",
            index === 0 && "rounded-l-full",
            index === segments.length - 1 && "rounded-r-full"
          )}
          style={{
            width: `${(segment.value / total) * 100}%`,
            backgroundColor: segment.color,
          }}
          title={segment.label ? `${segment.label}: ${segment.value}%` : undefined}
        />
      ))}
    </div>
  );
}

export { Progress, LabeledProgress, SegmentedProgress, progressVariants };
