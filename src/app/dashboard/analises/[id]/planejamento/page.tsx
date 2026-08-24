"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Sprout, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, DollarSign } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PlanejamentoSafraPage() {
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("diagnostico");

  // Mock prices for the cost tab
  const [prices, setPrices] = useState<Record<string, number>>({
    urea: 2500,
    map: 3800,
    kcl: 3200,
    calcario: 150
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
    return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-brand-main" /></div>;
  }

  if (error || !data) {
    return <div className="p-10 text-red-400">{error || "Erro desconhecido"}</div>;
  }

  const getLevelColor = (level: string) => {
    if (level === "Baixo") return "text-red-500 bg-red-500/10 border-red-500/20";
    if (level === "Médio") return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    if (level === "Adequado" || level === "Alto") return "text-brand-main bg-brand-main/10 border-brand-main/20";
    return "text-white/50 bg-white/5 border-white/10";
  };

  const getLevelIcon = (level: string) => {
    if (level === "Baixo") return <AlertTriangle className="w-4 h-4" />;
    if (level === "Médio") return <AlertTriangle className="w-4 h-4" />;
    if (level === "Adequado" || level === "Alto") return <CheckCircle2 className="w-4 h-4" />;
    return null;
  };

  const calcTotalCost = () => {
    let total = 0;
    if (data.liming.needed) {
      total += data.liming.tonPerHa * prices.calcario;
    }
    data.strategy.forEach((item: any) => {
      const pricePerTon = prices[item.fertilizer.id] || 3000;
      total += (item.kgPerHa / 1000) * pricePerTon;
    });
    return total;
  };

  return (
    <div className="max-w-5xl pb-20">
      <header className="mb-8">
        <Link href={`/dashboard/analises/${id}`} className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar para Análise
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-main/20 flex items-center justify-center border border-brand-main/30">
            <Sprout className="w-6 h-6 text-brand-main" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Motor Agronômico IA</h1>
            <p className="text-white/60">Planejamento focado em <strong className="text-white capitalize">{data.crop}</strong> (Meta: {data.yieldTonPerHa} t/ha)</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 border-b border-white/10 hide-scrollbar">
        {["diagnostico", "correcao", "adubacao", "custos"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all capitalize whitespace-nowrap ${
              activeTab === tab ? "bg-white text-black" : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab === "diagnostico" ? "1. Diagnóstico" : 
             tab === "correcao" ? "2. Correção" : 
             tab === "adubacao" ? "3. Adubação" : "4. Custos e Relatório"}
          </button>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 min-h-[400px]">
        {/* Tab 1: Diagnóstico */}
        {activeTab === "diagnostico" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-medium mb-1">Interpretação da Análise</h2>
              <p className="text-white/50 text-sm">Níveis nutricionais baseados em manuais agronômicos padrão.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(data.diagnosis).map(([param, info]: [string, any]) => (
                <div key={param} className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <div className="text-white/50 text-xs mb-1 font-medium">{param}</div>
                  <div className="text-2xl font-semibold mb-3">{info.value}</div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getLevelColor(info.level)}`}>
                    {getLevelIcon(info.level)} {info.level}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-8">
              <button onClick={() => setActiveTab("correcao")} className="flex items-center gap-2 text-brand-main font-medium hover:text-brand-light transition-colors">
                Próxima Etapa <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Correção */}
        {activeTab === "correcao" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-medium mb-1">Necessidade de Calagem</h2>
              <p className="text-white/50 text-sm">Cálculo baseado no método de elevação da saturação por bases.</p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-6 lg:p-10 text-center max-w-2xl mx-auto mt-8">
              {!data.liming.needed ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-brand-main/20 text-brand-main rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-medium">Solo Corrigido</h3>
                  <p className="text-white/60 text-sm">O nível de V% atual ({data.diagnosis.V.value}%) já está adequado ou superior ao exigido pela cultura ({data.crop}). Não há necessidade de calagem.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Aplicar Calcário</h3>
                  <div className="text-5xl font-bold text-white my-6">
                    {data.liming.tonPerHa} <span className="text-2xl text-white/50 font-medium">ton/ha</span>
                  </div>
                  <p className="text-white/60 text-sm">Considerando um calcário com PRNT de 100%. Se o PRNT for menor, a dose deve ser ajustada proporcionalmente.</p>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setActiveTab("diagnostico")} className="text-white/50 hover:text-white transition-colors text-sm">Voltar</button>
              <button onClick={() => setActiveTab("adubacao")} className="flex items-center gap-2 text-brand-main font-medium hover:text-brand-light transition-colors">
                Próxima Etapa <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Adubação */}
        {activeTab === "adubacao" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-medium mb-1">Recomendação de NPK</h2>
              <p className="text-white/50 text-sm">Extração necessária para atingir {data.yieldTonPerHa} t/ha de {data.crop}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-center">
                <div className="text-white/40 font-medium mb-2">Nitrogênio (N)</div>
                <div className="text-4xl font-bold text-blue-400">{data.requirements.N} <span className="text-sm font-medium text-white/40">kg/ha</span></div>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-center">
                <div className="text-white/40 font-medium mb-2">Fósforo (P₂O₅)</div>
                <div className="text-4xl font-bold text-brand-main">{data.requirements.P2O5} <span className="text-sm font-medium text-white/40">kg/ha</span></div>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-center">
                <div className="text-white/40 font-medium mb-2">Potássio (K₂O)</div>
                <div className="text-4xl font-bold text-orange-400">{data.requirements.K2O} <span className="text-sm font-medium text-white/40">kg/ha</span></div>
              </div>
            </div>

            <h3 className="text-lg font-medium mt-10 mb-4 border-b border-white/10 pb-2">Plano de Fertilizantes (Sugestão IA)</h3>
            
            <div className="space-y-3">
              {data.strategy.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <div className="font-medium">{item.fertilizer.name}</div>
                    <div className="text-xs text-white/50 mt-1">Fornece: {item.nutrientsSupplied.N.toFixed(1)} N | {item.nutrientsSupplied.P2O5.toFixed(1)} P | {item.nutrientsSupplied.K2O.toFixed(1)} K</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl">{item.kgPerHa} <span className="text-xs text-white/50 font-normal">kg/ha</span></div>
                  </div>
                </div>
              ))}
              {data.strategy.length === 0 && (
                <div className="p-6 text-center text-white/50 bg-black/40 rounded-xl">
                  Não há necessidade de aplicação de macronutrientes.
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setActiveTab("correcao")} className="text-white/50 hover:text-white transition-colors text-sm">Voltar</button>
              <button onClick={() => setActiveTab("custos")} className="flex items-center gap-2 text-brand-main font-medium hover:text-brand-light transition-colors">
                Próxima Etapa <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Custos */}
        {activeTab === "custos" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-xl font-medium mb-1">Análise Econômica</h2>
              <p className="text-white/50 text-sm">Estimativa de custos por hectare (valores simulados).</p>
            </div>

            <div className="overflow-x-auto mt-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-sm text-white/50">
                    <th className="pb-3 font-medium">Insumo</th>
                    <th className="pb-3 font-medium text-right">Dose (ha)</th>
                    <th className="pb-3 font-medium text-right">Preço/Ton (R$)</th>
                    <th className="pb-3 font-medium text-right">Custo/ha (R$)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {data.liming.needed && (
                    <tr className="border-b border-white/5">
                      <td className="py-4">Calcário Agrícola</td>
                      <td className="py-4 text-right">{data.liming.tonPerHa.toFixed(2)} t</td>
                      <td className="py-4 text-right">R$ {prices.calcario.toFixed(2)}</td>
                      <td className="py-4 text-right font-medium">R$ {(data.liming.tonPerHa * prices.calcario).toFixed(2)}</td>
                    </tr>
                  )}
                  {data.strategy.map((item: any, i: number) => {
                    const price = prices[item.fertilizer.id] || 3000;
                    const cost = (item.kgPerHa / 1000) * price;
                    return (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-4">{item.fertilizer.name}</td>
                        <td className="py-4 text-right">{item.kgPerHa} kg</td>
                        <td className="py-4 text-right">R$ {price.toFixed(2)}</td>
                        <td className="py-4 text-right font-medium">R$ {cost.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="py-6 text-right font-medium text-white/60">Custo Total por Hectare:</td>
                    <td className="py-6 text-right text-2xl font-bold text-brand-main">
                      R$ {calcTotalCost().toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-center mt-8">
              <button onClick={() => alert("Relatório PDF em desenvolvimento!")} className="flex items-center gap-2 bg-brand-main hover:bg-brand-light text-white font-medium py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(107,175,58,0.3)]">
                Baixar Relatório PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
