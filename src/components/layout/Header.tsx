"use client";

import { useState } from "react";
import { Search, Bell, Menu, Clock, FileText, Download } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ThemeSwitch } from "~/components/ThemeSwitch";

interface HeaderProps {
  title: string;
  breadcrumb?: string[];
  onMenuClick?: () => void;
  className?: string;
}

export function Header({
  title,
  breadcrumb,
  onMenuClick,
  className,
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6",
        className
      )}
    >
      {/* Left side - Menu button and title */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex flex-col">
          {breadcrumb && breadcrumb.length > 0 && (
            <nav className="hidden text-xs text-muted-foreground sm:block">
              {breadcrumb.map((item, index) => (
                <span key={index}>
                  {index > 0 && <span className="mx-1">/</span>}
                  <span className="hover:text-foreground">{item}</span>
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Søk..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-48 pl-9 lg:w-64"
          />
        </div>

        {/* Action buttons */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="outline" size="sm">
            <FileText className="size-4" />
            <span className="hidden lg:inline">Generer rapport</span>
          </Button>
          <Button variant="outline" size="sm">
            <Download className="size-4" />
            <span className="hidden lg:inline">Eksporter</span>
          </Button>
        </div>

        {/* Icon buttons */}
        <div className="flex items-center">
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Recent activity"
          >
            <Clock className="size-5" />
          </button>
          <button
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            {/* Notification badge */}
            <span className="absolute right-1.5 top-1.5 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          </button>

          {/* Theme switch */}
          <ThemeSwitch />

          {/* User avatar */}
          <button
            className="ml-2 flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent"
            aria-label="User menu"
          >
            <div className="size-8 rounded-full bg-primary/20">
              <span className="flex size-full items-center justify-center text-sm font-medium text-primary">
                MD
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
