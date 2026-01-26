"use client";

import { useState } from "react";
import { cn } from "~/lib/utils";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: string[];
  className?: string;
}

export function AppShell({
  children,
  title = "Dashboard",
  breadcrumb,
  className,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar className="fixed inset-y-0 left-0" />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <Header
          title={title}
          breadcrumb={breadcrumb}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        <main className={cn("flex-1", className)}>
          <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
