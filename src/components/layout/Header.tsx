"use client";

import { Bell, Search, Clock, Menu } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ThemeToggle } from "~/components/ThemeSwitch";

interface HeaderProps {
  title: string;
  breadcrumb?: string;
  className?: string;
  onMenuClick?: () => void;
  showMobileMenu?: boolean;
}

export function Header({
  title,
  breadcrumb,
  className,
  onMenuClick,
  showMobileMenu = false,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6",
        className
      )}
    >
      {/* Left: Title and mobile menu */}
      <div className="flex items-center gap-4">
        {showMobileMenu && (
          <button
            onClick={onMenuClick}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        )}
        
        <div>
          {breadcrumb && (
            <p className="text-xs text-muted-foreground">{breadcrumb}</p>
          )}
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </div>
      </div>

      {/* Right: Search, icons, user */}
      <div className="flex items-center gap-2">
        {/* Search - hidden on mobile */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Søk..."
            className="h-9 w-64 pl-9"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Mobile search toggle */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="size-5" />
          </Button>
          
          {/* History */}
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Clock className="size-5" />
          </Button>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5" />
            {/* Notification badge */}
            <span className="absolute right-1.5 top-1.5 flex size-2 items-center justify-center rounded-full bg-destructive" />
          </Button>
          
          {/* Theme toggle */}
          <ThemeToggle />
          
          {/* User avatar */}
          <button className="ml-2 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            ML
          </button>
        </div>
      </div>
    </header>
  );
}
