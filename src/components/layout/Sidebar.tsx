"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sun, Sparkles } from "lucide-react";
import { cn } from "~/lib/utils";
import { NavItem, NavSection } from "./NavItem";
import { navigation } from "~/data/navigation";
import { Button } from "~/components/ui/button";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
          <Sun className="size-6 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-bold text-sidebar-foreground">
              Suncare
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Service Management
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navigation.map((section) => (
            <NavSection
              key={section.id}
              label={section.label}
              collapsed={collapsed}
            >
              {section.items.map((item) => (
                <NavItem
                  key={item.id}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  badge={item.badge}
                  collapsed={collapsed}
                />
              ))}
            </NavSection>
          ))}
        </div>
      </div>

      {/* Upgrade card */}
      {!collapsed && (
        <div className="mx-3 mb-4 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground">
              Premium
            </span>
          </div>
          <p className="mb-3 text-xs text-sidebar-foreground/70">
            Oppgrader til Premium for avansert rapportering og AI-funksjoner.
          </p>
          <Button size="sm" className="w-full">
            Oppgrader
          </Button>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="size-5" />
          ) : (
            <>
              <ChevronLeft className="size-5" />
              <span>Skjul meny</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar className="h-full w-full border-r-0" />
      </div>
    </>
  );
}
