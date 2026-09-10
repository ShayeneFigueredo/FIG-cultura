"use client";

import React from "react";
import { format } from "date-fns";
import type { GridAnalysis, GridParameter } from "./types";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function DataGrid({ analyses }: { analyses: GridAnalysis[] }) {
  // Configuração das colunas no estilo de planilha
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col relative h-[600px] max-h-[70vh] group">
      
      {/* Tabela Principal */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse min-w-[2000px]">
          
          {/* Cabeçalho de Grupos (Seções da Planilha) */}
          <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm border-b-2 border-slate-200">
            <tr>
              <th colSpan={6} className="px-4 py-3 border-b border-r border-slate-200 text-center font-bold text-brand-main tracking-wider uppercase">Dados Iniciais</th>
              <th colSpan={5} className="px-4 py-3 border-b border-r border-slate-200 text-center font-bold text-blue-600 tracking-wider uppercase">Física e Química (Análise)</th>
              <th colSpan={3} className="px-4 py-3 border-b border-r border-slate-200 text-center font-bold text-amber-600 tracking-wider uppercase">Diagnóstico</th>
              <th colSpan={3} className="px-4 py-3 border-b border-r border-slate-200 text-center font-bold text-purple-600 tracking-wider uppercase">Planejamento & Correção</th>
              <th colSpan={1} className="px-4 py-3 border-b border-slate-200 text-center font-bold text-brand-main tracking-wider uppercase">AdubaSolo IA</th>
            </tr>
            {/* Cabeçalho de Colunas */}
            <tr className="bg-slate-50 text-slate-900 font-bold">
              {/* DADOS INICIAIS */}
              <th className="px-4 py-3 border-b border-r border-slate-200">Data</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">Propriedade</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">Talhão</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">Profund.</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">Cult. Anterior</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">Cult. Desejada</th>
              
              {/* ANÁLISE DE SOLO */}
              <th className="px-4 py-3 border-b border-r border-slate-200">Argila %</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">pH</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">P (mg/dm³)</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">K (cmolc/dm³)</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">V%</th>
              
              {/* DIAGNÓSTICO */}
              <th className="px-4 py-3 border-b border-r border-slate-200">Acidez</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">Fósforo</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">Potássio</th>
              
              {/* PLANEJAMENTO & CORREÇÃO */}
              <th className="px-4 py-3 border-b border-r border-slate-200">Calcário (t/ha)</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">Adubação Base</th>
              <th className="px-4 py-3 border-b border-r border-slate-200">Produtividade</th>

              {/* IA */}
              <th className="px-4 py-3 border-b border-slate-200">Ações</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-200">
            {analyses.map((analysis) => {
              const pMap: Record<string, number | string> = {};
              analysis.parameters?.forEach((p: GridParameter) => pMap[p.element] = p.value);

              const renderVal = (v: any) => (v === undefined || v === null || v === '') ? '-' : v;

              const rawV = pMap["V%"] ?? pMap["V"] ?? pMap["V_percent"];
              const vPercent = Number(rawV);
              const hasV = rawV !== undefined && rawV !== null && rawV !== "" && !isNaN(vPercent);
              const phVal = Number(pMap["pH"]);
              const hasPh = pMap["pH"] !== undefined && pMap["pH"] !== null && pMap["pH"] !== "" && !isNaN(phVal) && phVal > 0;
              let acidezClass = "—";
              if (hasPh) {
                if (phVal < 5.5) acidezClass = "🔴 Baixo";
                else if (phVal <= 6.5) acidezClass = "🟢 Adequado";
                else acidezClass = "🔴 Alto";
              } else if (hasV) {
                acidezClass = vPercent < 50 ? "⚠️ Atenção" : "🟢 Adequado";
              }
              const pValue = Number(pMap["P"]);
              const pClass = isNaN(pValue) ? "—" : pValue < 15 ? "🔴 Baixo" : "🟢 Adequado";
              const kValue = Number(pMap["K"]);
              const kClass = isNaN(kValue) ? "—" : kValue < 0.15 ? "🔴 Baixo" : (kValue < 0.3 ? "🟡 Médio" : "🟢 Adequado");

              return (
                <tr key={analysis.id} className="hover:bg-slate-50 transition-colors group text-slate-900 font-medium">
                  {/* DADOS INICIAIS */}
                  <td className="px-4 py-3 border-r border-slate-200 whitespace-nowrap text-slate-800">
                    {format(new Date(analysis.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200 font-bold text-slate-900">
                    {analysis.field?.property?.name}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200 font-bold text-brand-main">
                    {analysis.field?.name}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200 text-slate-700">{analysis.depth}</td>
                  <td className="px-4 py-3 border-r border-slate-200 text-slate-700">{analysis.culturaAnterior || '-'}</td>
                  <td className="px-4 py-3 border-r border-slate-200 text-slate-700">{analysis.culturaDesejada || '-'}</td>

                  {/* ANÁLISE DE SOLO */}
                  <td className="px-4 py-3 border-r border-slate-200 font-mono font-semibold text-slate-900">{renderVal(analysis.physicalChars?.argila)}</td>
                  <td className="px-4 py-3 border-r border-slate-200 font-mono font-semibold text-slate-900">{renderVal(pMap["pH"])}</td>
                  <td className="px-4 py-3 border-r border-slate-200 font-mono font-semibold text-slate-900">{renderVal(pValue)}</td>
                  <td className="px-4 py-3 border-r border-slate-200 font-mono font-semibold text-slate-900">{renderVal(kValue)}</td>
                  <td className="px-4 py-3 border-r border-slate-200 font-mono font-semibold text-slate-900">{hasV ? vPercent : '-'}</td>

                  {/* DIAGNÓSTICO */}
                  <td className="px-4 py-3 border-r border-slate-200 text-sm whitespace-nowrap font-bold text-slate-900">{acidezClass}</td>
                  <td className="px-4 py-3 border-r border-slate-200 text-sm whitespace-nowrap font-bold text-slate-900">{pClass}</td>
                  <td className="px-4 py-3 border-r border-slate-200 text-sm whitespace-nowrap font-bold text-slate-900">{kClass}</td>

                  {/* PLANEJAMENTO & CORREÇÃO */}
                  <td className="px-4 py-3 border-r border-slate-200 text-slate-800 font-medium">
                    {analysis.strategies?.[0]?.items?.find((i) => i.fertilizer?.name.toLowerCase().includes('calcário'))?.doseKgHa ?? '-'}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200 text-slate-800 font-medium">
                    {analysis.cropPlannings?.find((p) => p.fase === 'Plantio')?.fertilizer?.name || 'Não definido'}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-200 text-slate-800 font-medium">
                    {analysis.produtividade != null ? `${analysis.produtividade} sc/ha` : '-'}
                  </td>
                  
                  {/* IA */}
                  <td className="px-4 py-3">
                    <Link 
                      href={`/dashboard/analises/${analysis.id}/planejamento`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-main text-white hover:bg-brand-light rounded-lg transition-colors text-xs font-bold whitespace-nowrap shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Motor IA
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Footer Info */}
      <div className="bg-slate-100 border-t-2 border-slate-200 px-4 py-3 flex justify-between items-center text-sm text-slate-600 font-semibold">
        <span>Mostrando {analyses.length} análise(s)</span>
        <span>As linhas e colunas foram congeladas para facilitar a leitura. (Scroll horizontal disponível)</span>
      </div>
    </div>
  );
}
