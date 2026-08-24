"use client";

import { Download } from "lucide-react";
import { format } from "date-fns";
import type { GridAnalysis } from "./types";

const COLUMNS: { header: string; key: (a: GridAnalysis) => string }[] = [
  { header: "Data", key: (a) => (a.date ? format(new Date(a.date), "dd/MM/yyyy") : "") },
  { header: "Propriedade", key: (a) => a.field?.property?.name ?? "" },
  { header: "Talhão", key: (a) => a.field?.name ?? "" },
  { header: "Profundidade", key: (a) => a.depth ?? "" },
  { header: "Cultura Anterior", key: (a) => a.culturaAnterior ?? "" },
  { header: "Cultura Desejada", key: (a) => a.culturaDesejada ?? "" },
  { header: "Argila %", key: (a) => fmt(a.physicalChars?.argila) },
  { header: "pH", key: (a) => fmt(param(a, "pH")) },
  { header: "P (mg/dm³)", key: (a) => fmt(param(a, "P")) },
  { header: "K (cmolc/dm³)", key: (a) => fmt(param(a, "K")) },
  { header: "Ca (cmolc/dm³)", key: (a) => fmt(param(a, "Ca")) },
  { header: "Mg (cmolc/dm³)", key: (a) => fmt(param(a, "Mg")) },
  { header: "MO (dag/kg)", key: (a) => fmt(param(a, "MO")) },
  { header: "S (mg/dm³)", key: (a) => fmt(param(a, "S")) },
  { header: "CTC (cmolc/dm³)", key: (a) => fmt(param(a, "CTC")) },
  { header: "V%", key: (a) => fmt(param(a, "V%") ?? param(a, "V") ?? param(a, "V_percent")) },
  { header: "m%", key: (a) => fmt(param(a, "m%") ?? param(a, "m_percent")) },
  { header: "Laboratório", key: (a) => a.laboratory ?? "" },
  { header: "Metodologia", key: (a) => a.methodology ?? "" },
  { header: "Sistema de Cultivo", key: (a) => a.sistemaCultivo ?? "" },
  { header: "Produtividade", key: (a) => (a.produtividade != null ? String(a.produtividade) : "") },
  { header: "Observações", key: (a) => a.observacoes ?? "" },
];

function param(analysis: GridAnalysis, element: string): number | undefined {
  return analysis.parameters?.find((p) => p.element === element)?.value;
}

function fmt(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function buildCsv(analyses: GridAnalysis[]): string {
  const escape = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [
    COLUMNS.map((c) => c.header).join(";"),
    ...analyses.map((a) => COLUMNS.map((c) => escape(c.key(a))).join(";")),
  ];
  return lines.join("\r\n");
}

export function ExportCsvButton({ analyses }: { analyses: GridAnalysis[] }) {
  const handleExport = () => {
    const csv = buildCsv(analyses);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analises-solo-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors"
    >
      <Download className="w-4 h-4" /> Exportar Planilha
    </button>
  );
}
