"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SubscriptionGuardProps {
  subscriptionStatus: string;
  subscriptionEndsAt: string | null;
  createdAt: string;
  children: React.ReactNode;
}

export function SubscriptionGuard({
  subscriptionStatus,
  subscriptionEndsAt,
  createdAt,
  children,
}: SubscriptionGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpired, setIsExpired] = useState(false);

  const isPro = subscriptionStatus === "ACTIVE";
  const isAssinaturaPage = pathname.startsWith("/dashboard/assinatura");

  useEffect(() => {
    if (!isPro && !isAssinaturaPage) {
      setIsExpired(true);
      router.push("/dashboard/assinatura?status=required");
    } else if (isPro) {
      setIsExpired(false);
    }
  }, [isPro, pathname, isAssinaturaPage, router]);

  // Se a assinatura não estiver ativa e o usuário tentar acessar outra página, exibe o bloqueio
  if (!isPro && !isAssinaturaPage) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-brand-main/10 border-4 border-brand-main/20 text-brand-main flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            Assinatura Necessária
          </h2>

          <p className="text-slate-600 font-medium text-sm mb-6 leading-relaxed">
            Para acessar o sistema Cultiva, emitir diagnósticos por IA, gerar laudos em PDF e gerenciar suas fazendas, é necessário ativar o seu <strong className="text-brand-main">Plano PRO</strong>.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Sparkles className="w-4 h-4 text-brand-main shrink-0" /> Diagnósticos ilimitados de solo com IA
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Sparkles className="w-4 h-4 text-brand-main shrink-0" /> Emissão oficial de Laudos em PDF A4
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Sparkles className="w-4 h-4 text-brand-main shrink-0" /> Suporte técnico prioritário
            </div>
          </div>

          <Link
            href="/dashboard/assinatura"
            className="w-full py-4 px-6 rounded-2xl bg-brand-main hover:bg-brand-light text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 group"
          >
            Escolher um Plano e Ativar
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
