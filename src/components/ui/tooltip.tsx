"use client";

import * as React from "react";
import { cn } from "~/lib/utils";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
});

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({
  children,
  asChild,
  className,
}: {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  const { setOpen } = React.useContext(TooltipContext);

  const handleMouseEnter = () => setOpen(true);
  const handleMouseLeave = () => setOpen(false);
  const handleFocus = () => setOpen(true);
  const handleBlur = () => setOpen(false);

  const eventHandlers = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<typeof eventHandlers & { className?: string }>, {
      ...eventHandlers,
      className: cn((children as React.ReactElement<{ className?: string }>).props.className, className),
    });
  }

  return (
    <span {...eventHandlers} className={className}>
      {children}
    </span>
  );
}

function TooltipContent({
  children,
  side = "top",
  sideOffset = 4,
  className,
}: {
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  className?: string;
}) {
  const { open } = React.useContext(TooltipContext);

  if (!open) return null;

  const positionClasses = {
    top: `bottom-full left-1/2 -translate-x-1/2 mb-${sideOffset}`,
    right: `left-full top-1/2 -translate-y-1/2 ml-${sideOffset}`,
    bottom: `top-full left-1/2 -translate-x-1/2 mt-${sideOffset}`,
    left: `right-full top-1/2 -translate-y-1/2 mr-${sideOffset}`,
  };

  return (
    <div
      className={cn(
        "absolute z-50 overflow-hidden rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        positionClasses[side],
        className
      )}
      style={{
        marginTop: side === "bottom" ? `${sideOffset * 4}px` : undefined,
        marginBottom: side === "top" ? `${sideOffset * 4}px` : undefined,
        marginLeft: side === "right" ? `${sideOffset * 4}px` : undefined,
        marginRight: side === "left" ? `${sideOffset * 4}px` : undefined,
      }}
    >
      {children}
    </div>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
