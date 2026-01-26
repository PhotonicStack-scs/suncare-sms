"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "~/lib/theme";
import { cn } from "~/lib/utils";

interface ThemeSwitchProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeSwitch({ className, showLabel = false }: ThemeSwitchProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]!);
  };

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="size-4" />;
    }
    return resolvedTheme === "dark" ? (
      <Moon className="size-4" />
    ) : (
      <Sun className="size-4" />
    );
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md p-2",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-accent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
    >
      {getIcon()}
      {showLabel && <span className="text-sm">{getLabel()}</span>}
    </button>
  );
}

interface ThemeToggleGroupProps {
  className?: string;
}

export function ThemeToggleGroup({ className }: ThemeToggleGroupProps) {
  const { theme, setTheme } = useTheme();

  const options: Array<{ value: "light" | "dark" | "system"; icon: React.ReactNode; label: string }> = [
    { value: "light", icon: <Sun className="size-4" />, label: "Light" },
    { value: "dark", icon: <Moon className="size-4" />, label: "Dark" },
    { value: "system", icon: <Monitor className="size-4" />, label: "System" },
  ];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-muted p-1",
        className
      )}
      role="radiogroup"
      aria-label="Theme selection"
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5",
            "text-sm transition-colors",
            theme === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          role="radio"
          aria-checked={theme === option.value}
          aria-label={option.label}
        >
          {option.icon}
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
