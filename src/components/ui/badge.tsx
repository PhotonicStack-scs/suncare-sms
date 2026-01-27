import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-white",
        outline: 
          "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground",
        warning:
          "border-transparent bg-warning text-warning-foreground",
        info:
          "border-transparent bg-info text-info-foreground",
        // Status variants for service visits
        scheduled:
          "border-info/30 bg-info/10 text-info dark:border-info/50 dark:bg-info/20",
        "in-progress":
          "border-warning/30 bg-warning/10 text-warning dark:border-warning/50 dark:bg-warning/20",
        completed:
          "border-success/30 bg-success/10 text-success dark:border-success/50 dark:bg-success/20",
        blocked:
          "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/20",
        cancelled:
          "border-muted-foreground/30 bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Status badge with dot indicator
interface StatusBadgeProps extends BadgeProps {
  showDot?: boolean;
}

function StatusBadge({ className, variant, showDot = true, children, ...props }: StatusBadgeProps) {
  const dotColors: Record<string, string> = {
    scheduled: "bg-info",
    "in-progress": "bg-warning",
    completed: "bg-success",
    blocked: "bg-destructive",
    cancelled: "bg-muted-foreground",
  };

  const dotColor = variant ? dotColors[variant] ?? "bg-primary" : "bg-primary";

  return (
    <div className={cn(badgeVariants({ variant }), "gap-1.5", className)} {...props}>
      {showDot && <span className={cn("size-1.5 rounded-full", dotColor)} />}
      {children}
    </div>
  );
}

export { Badge, StatusBadge, badgeVariants };
