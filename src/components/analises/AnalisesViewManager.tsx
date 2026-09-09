"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Sprout, MapPin, Database, Sparkles, ChevronRight, LayoutGrid, Table, Calendar } from "lucide-react";
import DataGrid from "./DataGrid";
import type { GridAnalysis } from "./types";

interface GroupedByField {
  fieldId: string;
  fieldName: string;
  crop: string | null;
  area: number;
  propertyName: string;
  city: string;
  state: string;
  propertyId: string;
  analyses: GridAnalysis[];
}

export default function AnalisesViewManager({ analyses }: { analyses: GridAnalysis[] }) {
  const [activeView, setActiveView] = useState<'grouped' | 'grid'>('grouped');

  // Agrupa análises por Talhão / Área
  const fieldMap = new Map<string, GroupedByField>();

  analyses.forEach((analysis) => {
    const field = analysis.field;
    if (!field) return;

    const key = field.id || field.name;

    if (!fieldMap.has(key)) {
      fieldMap.set(key, {
        fieldId: field.id || "",
        fieldName: field.name,
        crop: field.crop || null,
        area: field.area || 0,
        propertyName: field.property?.name || 'Fazenda',
        city: field.property?.city || '',
        state: field.property?.state || '',
        propertyId: field.property?.id || '',
        analyses: [],
      });
    }

    fieldMap.get(key)!.analyses.push(analysis);
  });

  const groupedFields = Array.from(fieldMap.values());

  return (
    <div className="space-y-6">
      {/* Botões de Alternância de Visão */}
      <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveView('grouped')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeView === 'grouped'
              ? 'bg-white text-brand-main shadow-md font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Separado por Área / Talhão</span>
        </button>

        <button
          onClick={() => setActiveView('grid')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeView === 'grid'
              ? 'bg-white text-brand-main shadow-md font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>Planilha Geral</span>
        </button>
      </div>

      {/* Conteúdo da Visão */}
      {activeView === 'grouped' ? (
        <div className="space-y-8">
          {groupedFields.length === 0 ? (
            <div className="text-center py-12 bg-white border-2 border-slate-200 border-dashed rounded-3xl p-8">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Nenhuma análise cadastrada ainda.</p>
            </div>
          ) : (
            groupedFields.map((group) => {
              const latest = group.analyses[0];
              const paramMap: Record<string, number | string> = {};
              latest?.parameters?.forEach((p: any) => (paramMap[p.element] = p.value));

              const pH = paramMap["pH"] ?? paramMap["PH"] ?? "-";
              const V = paramMap["V%"] ?? paramMap["V"] ?? paramMap["V_percent"] ?? "-";
              const P = paramMap["P"] ?? "-";
              const K = paramMap["K"] ?? "-";
              const argila = latest?.physicalChars?.argila ?? "-";

              return (
                <div
                  key={group.fieldId}
                  className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm hover:border-brand-main/40 transition-colors"
                >
                  {/* Cabeçalho da Área/Talhão */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0 font-bold text-xs">
                          <Sprout className="w-4 h-4" />
                        </span>
                        <h3 className="text-2xl font-bold text-slate-900">{group.fieldName}</h3>
                        {group.crop && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                            {group.crop}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs font-medium flex items-center gap-2">
                        <span>{group.propertyName}</span> • <span>{group.city}/{group.state}</span> • <span>{group.area} hectares</span>
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/propriedades/${group.propertyId}/talhoes/${group.fieldId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-main hover:text-brand-light transition-colors self-start sm:self-center"
                    >
                      Ver Sessão Completa da Área <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Resumo da Análise de Solo da Área */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Análises de Solo Desta Área ({group.analyses.length})
                    </h4>

                    <div className="grid grid-cols-1 gap-3">
                      {group.analyses.map((analysis, index) => {
                        const pMap: Record<string, number | string> = {};
                        analysis.parameters?.forEach((p: any) => (pMap[p.element] = p.value));

                        const itempH = pMap["pH"] ?? pMap["PH"] ?? "-";
                        const itemV = pMap["V%"] ?? pMap["V"] ?? pMap["V_percent"] ?? "-";
                        const itemP = pMap["P"] ?? "-";
                        const itemK = pMap["K"] ?? "-";

                        return (
                          <div
                            key={analysis.id}
                            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-900 text-sm">
                                  {format(new Date(analysis.date), 'dd/MM/yyyy')}
                                </span>
                                {index === 0 && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                                    Mais Recente
                                  </span>
                                )}
                                <p className="text-slate-500 text-xs">Profundidade: {analysis.depth}</p>
                              </div>
                            </div>

                            {/* Valores Nutricionais */}
                            <div className="flex items-center gap-3 font-mono text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                              <span>pH: <strong className="text-slate-800">{itempH}</strong></span>
                              <span className="text-slate-300">•</span>
                              <span>V%: <strong className="text-slate-800">{itemV}%</strong></span>
                              <span className="text-slate-300">•</span>
                              <span>P: <strong className="text-slate-800">{itemP} mg</strong></span>
                              <span className="text-slate-300">•</span>
                              <span>K: <strong className="text-slate-800">{itemK}</strong></span>
                            </div>

                            <Link
                              href={`/dashboard/analises/${analysis.id}/planejamento`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-main hover:bg-brand-light text-white text-xs font-bold rounded-lg transition-colors self-start md:self-center shrink-0 shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Motor IA
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <DataGrid analyses={analyses} />
      )}
    </div>
  );
}
