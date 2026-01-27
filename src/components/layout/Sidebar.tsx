"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Building2,
  ClipboardCheck,
  Receipt,
  History,
  Settings,
  HelpCircle,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { NavItem, NavSection } from "./NavItem";
import { Button } from "~/components/ui/button";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64",
        className
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <Zap className="size-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">Suncare</span>
              <span className="text-[10px] text-sidebar-foreground/50">EnergiSmart</span>
            </div>
          )}
        </Link>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex size-7 items-center justify-center rounded-md text-sidebar-foreground/50 transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "absolute -right-3 top-6 z-10 border border-sidebar-border bg-sidebar shadow-sm"
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          <NavSection title="Meny" collapsed={collapsed}>
            <NavItem
              href="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              collapsed={collapsed}
            />
            <NavItem
              href="/planning"
              icon={Calendar}
              label="Planlegging"
              collapsed={collapsed}
            />
            <NavItem
              href="/visits"
              icon={ClipboardCheck}
              label="Servicebesøk"
              collapsed={collapsed}
              badge={3}
            />
            <NavItem
              href="/installations"
              icon={Building2}
              label="Anlegg"
              collapsed={collapsed}
            />
            <NavItem
              href="/agreements"
              icon={FileText}
              label="Avtaler"
              collapsed={collapsed}
            />
            <NavItem
              href="/invoices"
              icon={Receipt}
              label="Fakturering"
              collapsed={collapsed}
            />
            <NavItem
              href="/history"
              icon={History}
              label="Historikk"
              collapsed={collapsed}
            />
          </NavSection>

          <NavSection title="Verktøy" collapsed={collapsed}>
            <NavItem
              href="/settings"
              icon={Settings}
              label="Innstillinger"
              collapsed={collapsed}
            />
            <NavItem
              href="/help"
              icon={HelpCircle}
              label="Hjelpesenter"
              collapsed={collapsed}
            />
          </NavSection>
        </div>
      </div>

      {/* Upgrade Card */}
      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/20">
                <Sparkles className="size-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-sidebar-foreground">
                AI Rapporter
              </span>
            </div>
            <p className="mb-3 text-xs text-sidebar-foreground/60">
              Generer profesjonelle servicerapporter automatisk med AI.
            </p>
            <Button size="sm" className="w-full">
              Prøv nå
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
