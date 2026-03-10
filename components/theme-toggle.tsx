"use client";

import { useSyncExternalStore } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const options = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Laptop },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div className="h-10 w-36 rounded-full panel-soft" />;
  }

  return (
    <div className="flex items-center gap-1 rounded-full panel-soft p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs transition ${
              active
                ? "bg-[var(--color-gold)] text-[var(--color-ink)]"
                : "text-[var(--color-muted)] hover:bg-[var(--button-ghost)] hover:text-[var(--color-foreground)]"
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
