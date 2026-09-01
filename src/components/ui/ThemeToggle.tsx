"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("flex items-center gap-2 bg-black/10 dark:bg-white/5 p-1 rounded-xl", className)}>
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "flex-1 flex justify-center py-2 rounded-lg transition-colors",
          theme === "light" 
            ? "bg-white shadow-sm text-brand-main" 
            : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
        )}
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "flex-1 flex justify-center py-2 rounded-lg transition-colors",
          theme === "dark" 
            ? "bg-black shadow-sm text-brand-main" 
            : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
        )}
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
}
