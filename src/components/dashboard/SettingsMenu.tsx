"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 sm:p-3 text-black/50 hover:text-brand-accent dark:text-white/50 dark:hover:text-brand-accent transition-colors"
        aria-label="Configurações"
      >
        <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-black/90 border border-black/10 dark:border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 origin-top-right z-50">
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg text-black dark:text-white">Configurações</h3>
            
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider">
                Sessão Perfil
              </span>
              <Link
                href="/dashboard/perfil"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-brand-main/10 dark:hover:bg-brand-main/20 text-black/80 hover:text-brand-main dark:text-white/80 dark:hover:text-brand-main transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Meu Perfil</span>
              </Link>
            </div>

            <div className="h-px bg-black/10 dark:bg-white/10 w-full" />

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider">
                Tema do Sistema
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
