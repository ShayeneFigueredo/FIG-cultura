"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Eye,
  X,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import ReportPdfTemplate, { ReportPdfData } from "@/components/analises/ReportPdfTemplate";
import { exportElementToPdf } from "@/lib/pdfExporter";
import { FiggerMascot } from "@/components/ui/FiggerMascot";

export default function PlanejamentoSafraPage() {
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("diagnostico");
  const [isExporting, setIsExporting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Mock prices for the cost tab
  const [prices, setPrices] = useState<Record<string, number>>({
    urea: 2500,
    map: 3800,
    kcl: 3200,
    calcario: 150,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/analises/${id}/diagnostico`);
        if (!res.ok) throw new Error("Falha ao carregar diagnóstico");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-main" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-10 text-red-400">{error || "Erro desconhecido"}</div>;
  }

  const getLevelColor = (param: string, level: string) => {
    const isPh = param.toUpperCase() === "PH";
    if (isPh) {
      if (level === "Adequado") return "text-emerald-700 bg-emerald-50 border-2 border-emerald-200 font-bold";
      return "text-red-700 bg-red-50 border-2 border-red-200 font-bold";
    }
    if (level === "Baixo") return "text-red-700 bg-red-50 border-2 border-red-200 font-bold";
    if (level === "Médio") return "text-amber-700 bg-amber-50 border-2 border-amber-200 font-bold";
    if (level === "Adequado" || level === "Alto") return "text-emerald-700 bg-emerald-50 border-2 border-emerald-200 font-bold";
    return "text-slate-700 bg-slate-100 border-2 border-slate-200 font-bold";
  };

  const getLevelIcon = (param: string, level: string) => {
    const isPh = param.toUpperCase() === "PH";
    if (isPh) {
      if (level === "Adequado") return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
    if (level === "Baixo") return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (level === "Médio") return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    if (level === "Adequado" || level === "Alto") return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    return null;
  };

  const calcTotalCost = () => {
    let total = 0;
    if (data.liming?.needed) {
      total += data.liming.tonPerHa * prices.calcario;
    }
    data.strategy?.forEach((item: any) => {
      const pricePerTon = prices[item.fertilizer.id] || 3000;
      total += (item.kgPerHa / 1000) * pricePerTon;
    });
    return total;
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const cleanProp = (data.propertyName || "Fazenda").replace(/[^a-zA-Z0-9]/g, "_");
      const cleanField = (data.fieldName || "Talhao").replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `Laudo_Agronomico_Cultiva_${cleanProp}_${cleanField}`;
      await exportElementToPdf("agronomic-pdf-report", fileName);
      toast.success("Laudo agronômico em PDF baixado com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      toast.error("Erro ao exportar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const pdfData: ReportPdfData = {
    id: id,
    date: data.date,
    propertyName: data.propertyName || "Fazenda Modelo",
    fieldName: data.fieldName || "Talhão Principal",
    city: data.city,
    state: data.state,
    crop: data.crop,
    yieldTonPerHa: data.yieldTonPerHa,
    diagnosis: data.diagnosis,
    liming: data.liming,
    requirements: data.requirements,
    strategy: data.strategy || [],
    cropPlannings: data.cropPlannings,
    totalCost: calcTotalCost(),
  };

  return (
    <div className="max-w-5xl pb-20">
      {/* Offscreen Report Template for PDF Export */}
      <div style={{ display: "none" }}>
        <ReportPdfTemplate data={pdfData} />
      </div>

      {/* Modal de Pré-visualização do PDF */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <FileText className="w-5 h-5 text-brand-main" /> Pré-visualização do Laudo PDF
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-100">
              <div className="scale-90 origin-top transform-gpu">
                <ReportPdfTemplate data={pdfData} />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-xs text-slate-600 font-medium">Formato A4 Alta Definição</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-5 py-2.5 rounded-xl border-2 border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100"
                >
                  Fechar
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-main hover:bg-brand-light text-white font-semibold text-sm transition-all shadow-md"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isExporting ? "Gerando PDF..." : "Baixar PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8">
        <Link
          href={`/dashboard/analises`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Análises
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center shrink-0">
              <Sprout className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Motor Agronômico IA</h1>
              <p className="text-slate-600 font-medium">
                Planejamento para <strong className="text-slate-900 capitalize font-bold">{data.crop}</strong> em{" "}
                <strong className="text-slate-900 font-bold">{data.propertyName}</strong> ({data.fieldName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/recomendacoes?analysisId=${id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-sm transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              Tirar Dúvidas com Figger
            </Link>

            <button
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-all shadow-sm"
            >
              <Eye className="w-4 h-4 text-slate-700" /> Ver Laudo PDF
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-main hover:bg-brand-light text-white font-semibold text-sm transition-all shadow-md disabled:opacity-70"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? "Gerando PDF..." : "Baixar PDF"}
            </button>
          </div>
        </div>
      </header>

      {/* Banner de Consulta ao Figger */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-lime-50 border-2 border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <FiggerMascot className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 drop-shadow-md" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              Dúvidas sobre os cálculos ou laudo deste talhão?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              O Figger analisa o laudo da fazenda <strong>{data.propertyName}</strong> e explica doses de calcário, saturação por bases (V%) e adubação ideal.
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/recomendacoes?analysisId=${id}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shrink-0 transition-all shadow-md hover:scale-[1.02]"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          Consultar o Figger
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 border-b-2 border-slate-200 hide-scrollbar">
        {["diagnostico", "correcao", "adubacao", "custos"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all capitalize whitespace-nowrap ${
              activeTab === tab
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab === "diagnostico"
              ? "1. Diagnóstico"
              : tab === "correcao"
              ? "2. Correção"
              : tab === "adubacao"
              ? "3. Adubação"
              : "4. Custos e Relatório"}
          </button>
        ))}
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 lg:p-8 shadow-xl min-h-[400px]">
        {/* Tab 1: Diagnóstico */}
        {activeTab === "diagnostico" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Interpretação da Análise</h2>
              <p className="text-slate-600 text-sm font-medium">Níveis nutricionais baseados em manuais agronômicos padrão.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(data.diagnosis).map(([param, info]: [string, any]) => (
                <div key={param} className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="text-slate-700 text-xs mb-1 font-bold uppercase tracking-wider">{param}</div>
                  <div className="text-3xl font-extrabold text-slate-900 mb-3">{info.value}</div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${getLevelColor(
                      param,
                      info.level
                    )}`}
                  >
                    {getLevelIcon(param, info.level)} {info.level}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setActiveTab("correcao")}
                className="flex items-center gap-2 text-brand-main font-bold hover:text-brand-light transition-colors text-sm"
              >
                Próxima Etapa <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Correção */}
        {activeTab === "correcao" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Correção do Solo & Calagem / Acidificação</h2>
              <p className="text-slate-600 text-sm font-medium">
                Faixa de pH ideal para plantas: <strong className="text-slate-900 font-bold">5,5 a 6,5</strong>.
              </p>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 lg:p-10 text-center max-w-2xl mx-auto mt-8 shadow-sm">
              {data.liming.isAlkaline || Number(data.diagnosis.pH.value) >= 6.8 ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-amber-300">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                    Solo Alcalino (pH {data.diagnosis.pH.value})
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-2">
                    Acidificação com Enxofre Elementar (S⁰)
                  </h3>
                  <div className="text-5xl font-black text-amber-600 my-4 font-mono">
                    {data.liming.sulfurKgHa || Math.round((Number(data.diagnosis.pH.value) - 6.0) * 400)} <span className="text-2xl text-slate-600 font-semibold font-sans">kg/ha</span>
                  </div>
                  <p className="text-slate-700 text-sm font-semibold max-w-md mx-auto leading-relaxed bg-amber-50 border border-amber-200 p-4 rounded-2xl text-left">
                    ⚠️ <strong>ATENÇÃO AGRONÔMICA:</strong> O pH deste solo está elevado ({data.diagnosis.pH.value}). <strong>NÃO utilize Calcário</strong>, pois ele aumentaria ainda mais a alcalinidade. Utilize <strong>Enxofre Elementar (S⁰)</strong> para baixar o pH de volta para a faixa ideal (5,5 a 6,5).
                  </p>
                </div>
              ) : Number(data.diagnosis.pH.value) < 5.5 || data.liming.needed || data.liming.tonPerHa > 0 ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-red-300">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-900 font-extrabold text-xs uppercase tracking-wider">
                    Solo Ácido (pH {data.diagnosis.pH.value})
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-2">
                    Aplicação de Calcário Agrícola (Calagem)
                  </h3>
                  <div className="text-5xl font-extrabold text-slate-900 my-4 font-mono">
                    {data.liming.tonPerHa > 0 ? data.liming.tonPerHa : "1.5"} <span className="text-2xl text-slate-500 font-semibold font-sans">ton/ha</span>
                  </div>
                  <p className="text-slate-700 text-sm font-medium max-w-md mx-auto leading-relaxed bg-red-50 border border-red-200 p-4 rounded-2xl text-left">
                    O pH atual ({data.diagnosis.pH.value}) está abaixo da faixa ideal (5,5 a 6,5). Realizar calagem com calcário (PRNT 100%) para neutralizar o alumínio tóxico e elevar a saturação por bases (V%) exigida pela cultura ({data.crop}).
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-emerald-300">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Solo Corrigido / pH Ideal</h3>
                  <p className="text-slate-600 text-sm font-medium">
                    O nível de V% atual ({data.diagnosis.V.value}%) e o pH ({data.diagnosis.pH.value}) estão na faixa ideal (5,5 - 6,5) exigida pela cultura ({data.crop}). Não há necessidade de calagem.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setActiveTab("diagnostico")} className="text-slate-600 hover:text-slate-900 font-semibold text-sm">
                Voltar
              </button>
              <button
                onClick={() => setActiveTab("adubacao")}
                className="flex items-center gap-2 text-brand-main font-bold hover:text-brand-light transition-colors text-sm"
              >
                Próxima Etapa <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Adubação */}
        {activeTab === "adubacao" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Recomendação de NPK</h2>
              <p className="text-slate-600 text-sm font-medium">
                Extração necessária para atingir {data.yieldTonPerHa} t/ha de {data.crop}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-slate-600 font-bold mb-2">Nitrogênio (N)</div>
                <div className="text-4xl font-extrabold text-blue-600">
                  {data.requirements.N} <span className="text-sm font-semibold text-slate-500">kg/ha</span>
                </div>
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-slate-600 font-bold mb-2">Fósforo (P₂O₅)</div>
                <div className="text-4xl font-extrabold text-emerald-600">
                  {data.requirements.P2O5} <span className="text-sm font-semibold text-slate-500">kg/ha</span>
                </div>
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-slate-600 font-bold mb-2">Potássio (K₂O)</div>
                <div className="text-4xl font-extrabold text-amber-600">
                  {data.requirements.K2O} <span className="text-sm font-semibold text-slate-500">kg/ha</span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mt-10 mb-4 border-b-2 border-slate-200 pb-2">Plano de Fertilizantes (Sugestão IA)</h3>

            <div className="space-y-3">
              {data.strategy.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white border-2 border-slate-200 rounded-xl shadow-sm">
                  <div>
                    <div className="font-bold text-slate-900">{item.fertilizer.name}</div>
                    <div className="text-xs text-slate-600 font-medium mt-1">
                      Fornece: {item.nutrientsSupplied.N.toFixed(1)} N | {item.nutrientsSupplied.P2O5.toFixed(1)} P |{" "}
                      {item.nutrientsSupplied.K2O.toFixed(1)} K
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-xl text-slate-900">
                      {item.kgPerHa} <span className="text-xs text-slate-500 font-normal">kg/ha</span>
                    </div>
                  </div>
                </div>
              ))}
              {data.strategy.length === 0 && (
                <div className="p-6 text-center text-slate-500 bg-slate-50 border-2 border-slate-200 rounded-xl font-medium">
                  Não há necessidade de aplicação de macronutrientes.
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setActiveTab("correcao")} className="text-slate-600 hover:text-slate-900 font-semibold text-sm">
                Voltar
              </button>
              <button
                onClick={() => setActiveTab("custos")}
                className="flex items-center gap-2 text-brand-main font-bold hover:text-brand-light transition-colors text-sm"
              >
                Próxima Etapa <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Custos */}
        {activeTab === "custos" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Análise Econômica & Exportação</h2>
              <p className="text-slate-600 text-sm font-medium">Estimativa de custos por hectare e emissão do laudo técnico em PDF.</p>
            </div>

            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-sm text-slate-700">
                    <th className="pb-3 font-bold">Insumo</th>
                    <th className="pb-3 font-bold text-right">Dose (ha)</th>
                    <th className="pb-3 font-bold text-right">Preço/Ton (R$)</th>
                    <th className="pb-3 font-bold text-right">Custo/ha (R$)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {data.liming.needed && (
                    <tr className="border-b border-slate-200 text-slate-900 font-medium">
                      <td className="py-4">Calcário Agrícola</td>
                      <td className="py-4 text-right">{data.liming.tonPerHa.toFixed(2)} t</td>
                      <td className="py-4 text-right">R$ {prices.calcario.toFixed(2)}</td>
                      <td className="py-4 text-right font-bold text-slate-900">R$ {(data.liming.tonPerHa * prices.calcario).toFixed(2)}</td>
                    </tr>
                  )}
                  {data.strategy.map((item: any, i: number) => {
                    const price = prices[item.fertilizer.id] || 3000;
                    const cost = (item.kgPerHa / 1000) * price;
                    return (
                      <tr key={i} className="border-b border-slate-200 text-slate-900 font-medium">
                        <td className="py-4">{item.fertilizer.name}</td>
                        <td className="py-4 text-right">{item.kgPerHa} kg</td>
                        <td className="py-4 text-right">R$ {price.toFixed(2)}</td>
                        <td className="py-4 text-right font-bold text-slate-900">R$ {cost.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="py-6 text-right font-bold text-slate-700">
                      Custo Total por Hectare:
                    </td>
                    <td className="py-6 text-right text-2xl font-extrabold text-brand-main">R$ {calcTotalCost().toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 pt-6 border-t-2 border-slate-200">
              <button
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-2 bg-white border-2 border-slate-300 text-slate-900 font-semibold py-3.5 px-6 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
              >
                <Eye className="w-5 h-5 text-slate-700" /> Visualizar Laudo PDF
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="flex items-center gap-2 bg-brand-main hover:bg-brand-light text-white font-semibold py-3.5 px-8 rounded-xl transition-all shadow-md disabled:opacity-70"
              >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isExporting ? "Gerando PDF..." : "Baixar Relatório PDF Oficial"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
