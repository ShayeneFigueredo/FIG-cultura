"use client";

import React from "react";
import { format } from "date-fns";
import type { GridAnalysis, GridParameter } from "./types";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function DataGrid({ analyses }: { analyses: GridAnalysis[] }) {
  // Configuração das colunas no estilo de planilha
  return (
    <div className="w-full bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col relative h-[600px] max-h-[70vh] group">
      
      {/* Tabela Principal */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse min-w-[2000px]">
          
          {/* Cabeçalho de Grupos (Seções da Planilha) */}
          <thead className="bg-gray-50 dark:bg-black/40 sticky top-10 z-10 backdrop-blur-md shadow-sm">
            <tr>
              <th colSpan={6} className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10 text-center font-semibold text-brand-main tracking-wider uppercase">Dados Iniciais</th>
              <th colSpan={5} className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10 text-center font-semibold text-blue-500 dark:text-blue-400 tracking-wider uppercase">Física e Química (Análise)</th>
              <th colSpan={3} className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10 text-center font-semibold text-yellow-600 dark:text-yellow-500 tracking-wider uppercase">Diagnóstico</th>
              <th colSpan={3} className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10 text-center font-semibold text-purple-600 dark:text-purple-400 tracking-wider uppercase">Planejamento & Correção</th>
              <th colSpan={1} className="px-4 py-3 border-b border-black/10 dark:border-white/10 text-center font-semibold text-brand-main tracking-wider uppercase">AdubaSolo IA</th>
            </tr>
            {/* Cabeçalho de Colunas */}
            <tr className="bg-white/50 dark:bg-black/20 text-black dark:text-white">
              {/* DADOS INICIAIS */}
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Data</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Propriedade</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Talhão</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Profund.</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Cult. Anterior</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Cult. Desejada</th>
              
              {/* ANÁLISE DE SOLO */}
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Argila %</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">pH</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">P (mg/dm³)</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">K (cmolc/dm³)</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">V%</th>
              
              {/* DIAGNÓSTICO */}
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Acidez</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Fósforo</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Potássio</th>
              
              {/* PLANEJAMENTO & CORREÇÃO */}
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Calcário (t/ha)</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Adubação Base</th>
              <th className="px-4 py-3 border-b border-r border-black/10 dark:border-white/10">Produtividade</th>

              {/* IA */}
              <th className="px-4 py-3 border-b border-black/10 dark:border-white/10">Ações</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {analyses.map((analysis) => {
              const pMap: Record<string, number | string> = {};
              analysis.parameters?.forEach((p: GridParameter) => pMap[p.element] = p.value);

              const renderVal = (v: any) => (v === undefined || v === null || v === '') ? '-' : v;

              const vPercent = Number(pMap["V%"] ?? pMap["V"] ?? pMap["V_percent"]);
              const hasV = !isNaN(vPercent);
              const acidezClass = !hasV ? "—" : vPercent < 50 ? "⚠️ Atenção" : "🟢 Adequado";
              const pValue = Number(pMap["P"]);
              const pClass = isNaN(pValue) ? "—" : pValue < 15 ? "🔴 Baixo" : "🟢 Adequado";
              const kValue = Number(pMap["K"]);
              const kClass = isNaN(kValue) ? "—" : kValue < 0.15 ? "🔴 Baixo" : (kValue < 0.3 ? "🟡 Médio" : "🟢 Adequado");

              return (
                <tr key={analysis.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                  {/* DADOS INICIAIS */}
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 whitespace-nowrap text-black dark:text-white/80">
                    {format(new Date(analysis.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 font-medium text-black dark:text-white">
                    {analysis.field?.property?.name}
                  </td>
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 text-brand-main">
                    {analysis.field?.name}
                  </td>
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 text-black/70 dark:text-white/70">{analysis.depth}</td>
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 text-black/70 dark:text-white/70">{analysis.culturaAnterior || '-'}</td>
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 text-black/70 dark:text-white/70">{analysis.culturaDesejada || '-'}</td>

                  {/* ANÁLISE DE SOLO */}
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 font-mono text-black/80 dark:text-white/80">{renderVal(analysis.physicalChars?.argila)}</td>
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 font-mono text-black/80 dark:text-white/80">{renderVal(pMap["pH"])}</td>
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 font-mono text-black/80 dark:text-white/80">{renderVal(pValue)}</td>
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 font-mono text-black/80 dark:text-white/80">{renderVal(kValue)}</td>
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 font-mono text-black/80 dark:text-white/80">{hasV ? vPercent : '-'}</td>

                  {/* DIAGNÓSTICO */}
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 text-sm whitespace-nowrap text-black dark:text-white">{acidezClass}</td>
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 text-sm whitespace-nowrap text-black dark:text-white">{pClass}</td>
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 text-sm whitespace-nowrap text-black dark:text-white">{kClass}</td>

                  {/* PLANEJAMENTO & CORREÇÃO */}
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 text-black/70 dark:text-white/70">
                    {analysis.strategies?.[0]?.items?.find((i) => i.fertilizer?.name.toLowerCase().includes('calcário'))?.doseKgHa ?? '-'}
                  </td>
                  <td className="px-4 py-3 border-r border-black/5 dark:border-white/10 text-black/70 dark:text-white/70">
                    {analysis.cropPlannings?.find((p) => p.fase === 'Plantio')?.fertilizer?.name || 'Não definido'}
                  </td>
                  <td className="px-4 py-3 border-r border-white/10 text-white/70">
                    {analysis.produtividade != null ? `${analysis.produtividade} sc/ha` : '-'}
                  </td>
                  
                  {/* IA */}
                  <td className="px-4 py-3">
                    <Link 
                      href={`/dashboard/analises/${analysis.id}/planejamento`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-main/20 hover:bg-brand-main text-brand-main hover:text-white rounded-lg transition-colors text-xs font-medium whitespace-nowrap"
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
      <div className="bg-gray-100 dark:bg-black/40 border-t border-black/10 dark:border-white/10 px-4 py-3 flex justify-between items-center text-sm text-black/50 dark:text-white/50">
        <span>Mostrando {analyses.length} análise(s)</span>
        <span>As linhas e colunas foram congeladas para facilitar a leitura. (Scroll horizontal disponível)</span>
      </div>
    </div>
  );
}
