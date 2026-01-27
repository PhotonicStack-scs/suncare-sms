"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  badge?: string | number;
}

export function NavItem({ href, icon: Icon, label, collapsed, badge }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
      )}
      
      <Icon className={cn("size-5 shrink-0", isActive && "text-sidebar-primary")} />
      
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {badge}
            </span>
          )}
        </>
      )}
      
      {collapsed && badge !== undefined && (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
          {badge}
        </span>
      )}
    </Link>
  );
}

interface NavSectionProps {
  title?: string;
  children: React.ReactNode;
  collapsed?: boolean;
}

export function NavSection({ title, children, collapsed }: NavSectionProps) {
  return (
    <div className="space-y-1">
      {title && !collapsed && (
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          {title}
        </div>
      )}
      {title && collapsed && <div className="mx-auto my-2 h-px w-6 bg-sidebar-border" />}
      <nav className="space-y-0.5">{children}</nav>
    </div>
  );
}
