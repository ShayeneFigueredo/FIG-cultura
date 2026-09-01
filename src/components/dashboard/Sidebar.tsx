"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Map, Sprout, Calculator, LogOut, Menu, X, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarUser = {
  name: string;
  email: string;
  avatarUrl?: string | null;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/dashboard/propriedades", label: "Gestão de Áreas", icon: Map },
  { href: "/dashboard/analises", label: "Análise de Solo", icon: Sprout },
  { href: "/dashboard/recomendacoes", label: "Recomendações IA", icon: BookOpen },
];

const SECONDARY_NAV_ITEMS = [
  { href: "/dashboard/perfil", label: "Meu Perfil", icon: User },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "U";
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* Barra superior mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-[#163316] backdrop-blur-xl border-b border-white/10">
        <Image src="/cultivalogo-powered.png" alt="Cultiva" width={200} height={60} className="w-auto h-12 object-contain" />
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={cn(
          "w-64 border-r border-white/10 bg-[#163316] h-screen flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300",
          "pt-20 lg:pt-0", // espaço para a barra superior no mobile
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 hidden lg:flex border-b border-white/10">
          <Link href="/dashboard" className="block relative h-14 w-full group">
            <Image
              src="/cultivalogo-powered.png"
              alt="Cultiva"
              fill
              className="object-contain object-left"
              priority
            />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="mb-6">
            <span className="px-3 text-xs font-semibold text-white/40 uppercase tracking-wider">
              Menu Principal
            </span>
            <div className="mt-2 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                    isActive(item.href)
                      ? "bg-brand-main text-white font-medium"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive(item.href) ? "text-white" : "text-white/50 group-hover:text-brand-accent"
                    )}
                  />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/10">
            {SECONDARY_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive(item.href)
                    ? "bg-brand-main text-white font-medium"
                    : "text-white/70 hover:text-white hover:bg-white/5 group"
                )}
              >
                <item.icon className="w-5 h-5 group-hover:text-brand-accent transition-colors" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          <Link
            href="/dashboard/motor"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mt-2 group",
              isActive("/dashboard/motor")
                ? "bg-brand-main text-white font-medium"
                : "text-white/70 hover:text-white hover:bg-white/5"
            )}
          >
            <Calculator className="w-5 h-5 text-brand-accent group-hover:text-brand-accent" />
            <span className={cn("font-medium", isActive("/dashboard/motor") ? "text-white" : "text-brand-accent")}>Motor Agronômico</span>
            <span className="ml-auto text-[10px] uppercase tracking-wider bg-brand-accent text-white font-bold rounded-full px-2 py-0.5 animate-pulse">
              NOVO
            </span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-white/60 mb-2">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden relative">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.name} fill className="object-cover" unoptimized />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-white font-medium truncate">{user.name}</p>
              <p className="text-xs truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:text-white hover:bg-red-500 transition-colors text-left group"
          >
            <LogOut className="w-5 h-5 group-hover:text-white" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
}
