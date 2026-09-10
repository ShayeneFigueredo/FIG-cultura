"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  Loader2,
  Award,
  ArrowRight,
  HelpCircle,
  Clock,
  Star,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

const MP_MONTHLY_LINK = "https://mpago.la/1S7FPd4";
const MP_YEARLY_LINK = "https://mpago.la/1E5uXrf";
const WHATSAPP_LINK = "https://wa.me/5538997507651?text=Ol%C3%A1!%20Estou%20na%20p%C3%A1gina%20de%20planos%20do%20Cultiva%20e%20gostaria%20de%20tirar%20algumas%20d%C3%BAvidas.";

export default function SubscriptionPage() {
  const [userStatus, setUserStatus] = useState<{
    status: string;
    endsAt?: string | null;
    createdAt?: string;
    email?: string;
  }>({ status: "TRIAL" });
  const [loadingUser, setLoadingUser] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  const fetchProfile = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setUserStatus({
          status: data.subscriptionStatus || "TRIAL",
          endsAt: data.subscriptionEndsAt,
          createdAt: data.createdAt,
          email: data.email,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUser(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (statusParam === "success") {
      toast.success("Pagamento/Assinatura processada com sucesso! Atualizando seus benefícios...");
      fetchProfile();
    } else if (statusParam === "expired") {
      toast.error("Seu período de teste grátis expirou. Escolha um plano para reativar seu acesso total!");
    }
  }, [statusParam]);

  const handleSubscribe = (plan: "monthly" | "yearly") => {
    const targetLink = plan === "yearly" ? MP_YEARLY_LINK : MP_MONTHLY_LINK;
    toast.info("Redirecionando para o ambiente seguro do Mercado Pago...");
    window.location.href = targetLink;
  };

  const isPro = userStatus.status === "ACTIVE";

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-in fade-in duration-500">
      {/* Header Banner */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-main/10 border border-brand-main/20 text-brand-main font-bold text-xs uppercase tracking-wider mb-4">
          <Award className="w-4 h-4 text-brand-main" /> Plano Fundador PRO • Acesso Ilimitado
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Escolha o Plano Ideal para sua Consultoria
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium">
          Gerencie fazendas, analise solos com IA, emita laudos em PDF oficial e impulsione sua produtividade com o Cultiva.
        </p>

        {/* Toggle de Período */}
        <div className="mt-8 inline-flex items-center bg-slate-200 p-1.5 rounded-2xl border border-slate-300 shadow-inner">
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              selectedPlan === "monthly"
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Cobrança Mensal (R$ 99,90)
          </button>
          <button
            onClick={() => setSelectedPlan("yearly")}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              selectedPlan === "yearly"
                ? "bg-brand-main text-white shadow-md"
                : "text-slate-700 hover:text-slate-900"
            }`}
          >
            Cobrança Anual (R$ 999,90)
            <span className="text-[10px] bg-brand-accent text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-black">
              2 Meses Grátis
            </span>
          </button>
        </div>
      </header>

      {/* Cartão de Status Atual */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 mb-10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
              isPro
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-amber-50 border-amber-300 text-amber-700"
            }`}
          >
            {isPro ? <ShieldCheck className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Status da sua Conta:</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  isPro
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {loadingUser ? "Verificando..." : isPro ? "PLANO PRO ATIVO" : "SEM ASSINATURA ATIVA"}
              </span>
              <button
                onClick={fetchProfile}
                disabled={isRefreshing}
                title="Atualizar status"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isPro
                ? "Sua assinatura está ativa com acesso ilimitado a todas as ferramentas."
                : "Para liberar e utilizar todas as ferramentas do Cultiva, escolha e assine um dos planos abaixo."}
            </p>
          </div>
        </div>

        {!isPro && (
          <button
            onClick={() => handleSubscribe(selectedPlan)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-main hover:bg-brand-light text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <Zap className="w-4 h-4 text-yellow-300" />
            Ativar Plano PRO Agora
          </button>
        )}
      </div>

      {/* Cards Comparativos (Mensal vs Anual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Cartão Plano Mensal */}
        <div
          className={`bg-white border-2 rounded-3xl p-8 shadow-md flex flex-col justify-between transition-all ${
            selectedPlan === "monthly" ? "border-brand-main ring-4 ring-brand-main/10 shadow-xl" : "border-slate-200"
          }`}
        >
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-slate-900">Plano Mensal</h3>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                Flexibilidade Total
              </span>
            </div>

            <div className="my-6">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-500">R$</span>
                <span className="text-5xl font-extrabold text-slate-900 tracking-tight">99,90</span>
                <span className="text-slate-500 font-semibold text-sm">/ mês</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-2">
                Cobrança recorrente mensal via Mercado Pago. Cancele quando quiser sem multa.
              </p>
            </div>

            <div className="space-y-3 py-6 border-t border-slate-200 text-sm">
              <div className="flex items-center gap-2.5 font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-brand-main shrink-0" /> Diagnósticos de Solo Ilimitados com IA
              </div>
              <div className="flex items-center gap-2.5 font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-brand-main shrink-0" /> Motor NPK & Calagem por Produtividade
              </div>
              <div className="flex items-center gap-2.5 font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-brand-main shrink-0" /> Emissão de Laudos em PDF A4 Oficial
              </div>
              <div className="flex items-center gap-2.5 font-semibold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-brand-main shrink-0" /> Módulo de Gestão de Equipe & Fazendas
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSubscribe("monthly")}
            disabled={isPro}
            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-6 ${
              isPro
                ? "bg-slate-200 text-slate-500 cursor-default"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
          >
            {isPro ? "Você já é Assinante" : "Assinar Mensal por R$ 99,90"}
            {!isPro && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Cartão Plano Anual (RECOMENDADO) */}
        <div
          className={`bg-gradient-to-b from-slate-900 to-slate-800 text-white border-2 rounded-3xl p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden ${
            selectedPlan === "yearly" ? "border-brand-accent ring-4 ring-brand-accent/20" : "border-slate-700"
          }`}
        >
          <div className="absolute top-0 right-0 bg-brand-accent text-white font-black text-xs px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-md">
            Melhor Valor • Economize R$ 198,90
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-xs font-bold text-brand-accent uppercase tracking-widest flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-brand-accent" /> Recomendado
                </span>
                <h3 className="text-2xl font-black text-white mt-0.5">Plano Anual PRO</h3>
              </div>
            </div>

            <div className="my-6">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-300">R$</span>
                <span className="text-5xl font-black text-white tracking-tight">999,90</span>
                <span className="text-slate-400 font-semibold text-sm">/ ano</span>
              </div>
              <p className="text-xs text-brand-light font-bold mt-2">
                Equivalente a R$ 83,32 / mês (2 meses totalmente grátis!)
              </p>
            </div>

            <div className="space-y-3 py-6 border-t border-slate-700 text-sm">
              <div className="flex items-center gap-2.5 font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Tudo do Plano Mensal Incluído
              </div>
              <div className="flex items-center gap-2.5 font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Garantia de Tarifa Congelada por 12 meses
              </div>
              <div className="flex items-center gap-2.5 font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Suporte Prioritário VIP via WhatsApp
              </div>
              <div className="flex items-center gap-2.5 font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Acesso Antecipado aos Novos Recursos de IA
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSubscribe("yearly")}
            disabled={isPro}
            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-2 mt-6 ${
              isPro
                ? "bg-slate-700 text-slate-400 cursor-default"
                : "bg-brand-main hover:bg-brand-light text-white shadow-brand-main/40"
            }`}
          >
            {isPro ? "Você já é Assinante PRO" : "Assinar Anual por R$ 999,90"}
            {!isPro && <Zap className="w-4 h-4 text-yellow-300" />}
          </button>
        </div>
      </div>

      {/* Dúvidas / WhatsApp Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 mb-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center shrink-0 shadow-inner">
            <MessageCircle className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366] text-[11px] font-bold uppercase tracking-wider mb-1">
              Atendimento Direto
            </div>
            <h3 className="text-xl font-black text-white">
              Ficou com alguma dúvida sobre os planos?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-normal mt-0.5 max-w-xl">
              Fale diretamente com nossa equipe no WhatsApp para tirar dúvidas sobre recursos, formas de pagamento ou pacotes corporativos.
            </p>
          </div>
        </div>

        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-lg shadow-[#25D366]/20 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Falar no WhatsApp (38) 99750-7651</span>
        </a>
      </div>

      {/* Garantia e FAQ */}
      <section className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-slate-500" /> Perguntas Frequentes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-bold text-slate-900 mb-1">Como funciona a assinatura pelo Mercado Pago?</h3>
            <p className="text-slate-600 font-medium text-xs">
              Ao clicar em assinar, você é direcionado para a página oficial do Mercado Pago para efetuar o pagamento via Cartão de Crédito ou PIX com renovação automática.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">Qual a vantagem do Plano Anual?</h3>
            <p className="text-slate-600 font-medium text-xs">
              No plano anual você economiza R$ 198,90 em relação ao mensal (é o equivalente a ganhar 2 meses de uso totalmente grátis no ano).
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">Posso emitir quantos laudos quiser?</h3>
            <p className="text-slate-600 font-medium text-xs">
              Sim! Tanto o plano mensal quanto o anual oferecem acesso ilimitado sem travas de laudos ou hectares.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">Como cancelo caso precise?</h3>
            <p className="text-slate-600 font-medium text-xs">
              Você pode cancelar a renovação a qualquer momento diretamente no seu aplicativo ou conta do Mercado Pago sem qualquer taxa ou burocracia.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
