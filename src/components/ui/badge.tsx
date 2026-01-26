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
        outline: "text-foreground",
        // Status variants for service management
        success:
          "border-transparent bg-success/15 text-success dark:bg-success/20",
        warning:
          "border-transparent bg-warning/15 text-warning dark:bg-warning/20",
        info:
          "border-transparent bg-info/15 text-info dark:bg-info/20",
        // Service-specific status badges
        scheduled:
          "border-transparent bg-info/15 text-info dark:bg-info/20",
        inProgress:
          "border-transparent bg-warning/15 text-warning dark:bg-warning/20",
        completed:
          "border-transparent bg-success/15 text-success dark:bg-success/20",
        blocked:
          "border-transparent bg-destructive/15 text-destructive dark:bg-destructive/20",
        pending:
          "border-transparent bg-muted text-muted-foreground",
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
interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: "scheduled" | "inProgress" | "completed" | "blocked" | "pending";
  showDot?: boolean;
}

const statusLabels: Record<StatusBadgeProps["status"], string> = {
  scheduled: "Planlagt",
  inProgress: "Pågår",
  completed: "Fullført",
  blocked: "Blokkert",
  pending: "Venter",
};

function StatusBadge({
  status,
  showDot = true,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge variant={status} className={cn("gap-1.5", className)} {...props}>
      {showDot && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            status === "scheduled" && "bg-info",
            status === "inProgress" && "bg-warning",
            status === "completed" && "bg-success",
            status === "blocked" && "bg-destructive",
            status === "pending" && "bg-muted-foreground"
          )}
        />
      )}
      {children ?? statusLabels[status]}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge };
