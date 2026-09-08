"use client";

import React from "react";
import { Sprout, CheckCircle2, AlertTriangle, FileText, Award } from "lucide-react";

export type ReportPdfData = {
  id: string;
  date?: string;
  propertyName: string;
  fieldName: string;
  city?: string;
  state?: string;
  agronomistName?: string;
  crop: string;
  yieldTonPerHa: string;
  diagnosis: Record<string, { value: number | string; level: string }>;
  liming: {
    needed: boolean;
    tonPerHa: number;
  };
  requirements: {
    N: number;
    P2O5: number;
    K2O: number;
  };
  strategy: Array<{
    fertilizer: { name: string };
    kgPerHa: number;
    nutrientsSupplied: { N: number; P2O5: number; K2O: number };
  }>;
  cropPlannings?: Array<{
    fase: string;
    diasPosPlantio?: number | null;
    doseKgHa?: number | null;
    fertilizer?: { name: string } | null;
  }>;
  totalCost?: number;
};

export default function ReportPdfTemplate({ data }: { data: ReportPdfData }) {
  const formattedDate = data.date
    ? new Date(data.date).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  return (
    <div
      id="agronomic-pdf-report"
      className="w-[800px] bg-white text-slate-900 font-sans p-8 border border-slate-200 rounded-xl shadow-2xl mx-auto my-4 text-sm"
      style={{ minHeight: "1120px", backgroundColor: "#ffffff", color: "#0f172a", borderColor: "#cbd5e1" }}
    >
      {/* Header com Branding FIG AgroTech e Cultiva */}
      <header className="flex items-center justify-between border-b-2 pb-6 mb-6" style={{ borderColor: "#059669" }}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            {/* Logo Oficial FIG AgroTech */}
            <img src="/logo-preto.png" alt="FIG AgroTech" className="h-10 w-auto object-contain" />
            <span className="text-2xl font-black tracking-tight" style={{ color: "#0f172a" }}>
              CULTIVA <span className="text-xs font-normal px-2 py-0.5 rounded uppercase tracking-widest ml-1" style={{ color: "#059669", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}>by FIG AgroTech</span>
            </span>
          </div>
          <p className="text-xs font-medium" style={{ color: "#64748b" }}>
            Plataforma Agronômica Inteligente • Diagnóstico de Solo e Recomendação Nutricional
          </p>
        </div>

        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 font-bold text-xs rounded-full mb-1" style={{ backgroundColor: "#059669", color: "#ffffff" }}>
            <Award className="w-3.5 h-3.5" /> LAUDO TÉCNICO OFICIAL
          </div>
          <div className="text-xs" style={{ color: "#64748b" }}>Data de Emissão: <strong style={{ color: "#1e293b" }}>{formattedDate}</strong></div>
        </div>
      </header>

      {/* Cartões de Identificação da Fazenda e Talhão */}
      <div className="grid grid-cols-2 gap-4 mb-6 rounded-xl p-4" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#047857" }}>Propriedade Rural</div>
          <div className="text-base font-bold" style={{ color: "#1e293b" }}>{data.propertyName}</div>
          <div className="text-xs" style={{ color: "#64748b" }}>{data.city && data.state ? `${data.city} / ${data.state}` : "Região Agrícola"}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#047857" }}>Talhão / Cultura Planejada</div>
          <div className="text-base font-bold" style={{ color: "#1e293b" }}>
            {data.fieldName} • <span className="capitalize" style={{ color: "#059669" }}>{data.crop}</span>
          </div>
          <div className="text-xs" style={{ color: "#64748b" }}>Meta de Produtividade: <strong style={{ color: "#1e293b" }}>{data.yieldTonPerHa} t/ha</strong></div>
        </div>
      </div>

      {/* Seção 1: Diagnóstico Químico de Fertilidade */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 pb-1.5" style={{ color: "#1e293b", borderBottom: "1px solid #e2e8f0" }}>
          <FileText className="w-4 h-4" style={{ color: "#059669" }} /> 1. Diagnóstico de Fertilidade do Solo
        </h2>
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(data.diagnosis).map(([param, info]) => {
            const isLow = info.level === "Baixo";
            const isAdequate = info.level === "Adequado" || info.level === "Alto";
            const cardBg = isLow ? "#fef2f2" : isAdequate ? "#ecfdf5" : "#fffbeb";
            const cardBorder = isLow ? "#fecaca" : isAdequate ? "#a7f3d0" : "#fde68a";
            const cardText = isLow ? "#7f1d1d" : isAdequate ? "#064e3b" : "#78350f";

            return (
              <div
                key={param}
                className="p-3 rounded-lg border text-center"
                style={{ backgroundColor: cardBg, borderColor: cardBorder, color: cardText }}
              >
                <div className="text-xs font-bold uppercase" style={{ color: "#64748b" }}>{param}</div>
                <div className="text-lg font-black my-0.5" style={{ color: cardText }}>{info.value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider">{info.level}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Seção 2: Correção de Solo (Calagem) */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 pb-1.5" style={{ color: "#1e293b", borderBottom: "1px solid #e2e8f0" }}>
          <Sprout className="w-4 h-4" style={{ color: "#059669" }} /> 2. Requerimento de Calagem (Correção de Solo)
        </h2>
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-3">
            {data.liming.needed ? (
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#fef3c7", border: "1px solid #fcd34d", color: "#b45309" }}>
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#d1fae5", border: "1px solid #6ee7b7", color: "#047857" }}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="text-xs font-semibold" style={{ color: "#64748b" }}>Método da Saturação por Bases (V%)</div>
              <div className="text-sm font-bold" style={{ color: "#1e293b" }}>
                {data.liming.needed ? "Aplicação Recomendada de Calcário Agrícola" : "Solo em Nível Adequado de Calagem"}
              </div>
              <div className="text-xs" style={{ color: "#64748b" }}>Considerando Calcário com PRNT = 100% (incorporação 0-20cm).</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black" style={{ color: "#0f172a" }}>
              {data.liming.needed ? data.liming.tonPerHa : 0} <span className="text-sm font-normal" style={{ color: "#64748b" }}>t/ha</span>
            </div>
            <div className="text-xs font-semibold" style={{ color: "#059669" }}>Dose de Correção</div>
          </div>
        </div>
      </section>

      {/* Seção 3: Recomendação Nutricional NPK */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 pb-1.5" style={{ color: "#1e293b", borderBottom: "1px solid #e2e8f0" }}>
          📊 3. Exigência Nutricional de Macronutrientes (NPK)
        </h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <div className="text-xs font-bold" style={{ color: "#1d4ed8" }}>Nitrogênio (N)</div>
            <div className="text-2xl font-black my-1" style={{ color: "#1e3a8a" }}>{data.requirements.N} <span className="text-xs font-medium" style={{ color: "#64748b" }}>kg/ha</span></div>
            <div className="text-[10px]" style={{ color: "#2563eb" }}>Desenvolvimento Vegetativo</div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}>
            <div className="text-xs font-bold" style={{ color: "#047857" }}>Fósforo (P₂O₅)</div>
            <div className="text-2xl font-black my-1" style={{ color: "#064e3b" }}>{data.requirements.P2O5} <span className="text-xs font-medium" style={{ color: "#64748b" }}>kg/ha</span></div>
            <div className="text-[10px]" style={{ color: "#059669" }}>Enraizamento e Floração</div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
            <div className="text-xs font-bold" style={{ color: "#b45309" }}>Potássio (K₂O)</div>
            <div className="text-2xl font-black my-1" style={{ color: "#78350f" }}>{data.requirements.K2O} <span className="text-xs font-medium" style={{ color: "#64748b" }}>kg/ha</span></div>
            <div className="text-[10px]" style={{ color: "#d97706" }}>Enchimento de Grãos/Frutos</div>
          </div>
        </div>
      </section>

      {/* Seção 4: Plano de Adubação de Precisão */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 pb-1.5" style={{ color: "#1e293b", borderBottom: "1px solid #e2e8f0" }}>
          🚜 4. Plano Prático de Aplicação de Insumos
        </h2>
        <table className="w-full text-left border-collapse rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
          <thead>
            <tr className="text-xs uppercase font-bold" style={{ backgroundColor: "#f1f5f9", color: "#334155", borderBottom: "1px solid #e2e8f0" }}>
              <th className="py-2.5 px-3">Fertilizante / Insumo</th>
              <th className="py-2.5 px-3 text-right">Dose Recomendada</th>
              <th className="py-2.5 px-3 text-right">Aporte NPK (kg/ha)</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {data.strategy.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td className="py-2.5 px-3 font-bold" style={{ color: "#1e293b" }}>{item.fertilizer.name}</td>
                <td className="py-2.5 px-3 text-right font-black text-sm" style={{ color: "#047857" }}>
                  {item.kgPerHa} kg/ha
                </td>
                <td className="py-2.5 px-3 text-right" style={{ color: "#475569" }}>
                  N: {item.nutrientsSupplied.N.toFixed(0)} | P₂O₅: {item.nutrientsSupplied.P2O5.toFixed(0)} | K₂O: {item.nutrientsSupplied.K2O.toFixed(0)}
                </td>
              </tr>
            ))}
            {data.strategy.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center" style={{ color: "#94a3b8" }}>Sem recomendação de adubação química necessária.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Rodapé e Assinatura Técnica */}
      <footer className="mt-auto pt-6 flex items-end justify-between" style={{ borderTop: "2px solid #e2e8f0" }}>
        <div>
          <div className="text-xs font-bold" style={{ color: "#1e293b" }}>FIG AgroTech • Plataforma Cultiva</div>
          <div className="text-[10px]" style={{ color: "#94a3b8" }}>Uberlândia/MG • Januária/MG</div>
          <div className="text-[10px] font-semibold mt-1" style={{ color: "#047857" }}>Desenvolvido por Shayene Figueredo & Caio Figueredo</div>
        </div>

        <div className="text-center w-64">
          <div className="mb-1 pb-4" style={{ borderBottom: "1px solid #94a3b8" }}></div>
          <div className="text-xs font-bold" style={{ color: "#1e293b" }}>
            {data.agronomistName || "Caio Figueredo — Eng. Agrônomo"}
          </div>
          <div className="text-[10px]" style={{ color: "#64748b" }}>Responsável Técnico / CREA</div>
        </div>
      </footer>
    </div>
  );
}
