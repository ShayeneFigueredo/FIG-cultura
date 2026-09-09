import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  ArrowLeft, Sprout, Ruler, MapPin, Plus, Database, 
  Sparkles, Calendar, ArrowRight, CheckCircle2, AlertTriangle, FileText
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export default async function TalhaoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string; fieldId: string }>;
}) {
  const { id, fieldId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const field = await prisma.field.findFirst({
    where: {
      id: fieldId,
      propertyId: id,
      property: {
        userId: session.user.id,
      },
    },
    include: {
      property: true,
      soilAnalyses: {
        orderBy: { date: "desc" },
        include: {
          parameters: true,
          physicalChars: true,
          recommendations: true,
          strategies: {
            include: {
              items: {
                include: { fertilizer: true },
              },
            },
          },
          cropPlannings: {
            include: { fertilizer: true },
          },
        },
      },
    },
  });

  if (!field) {
    redirect(`/dashboard/propriedades/${id}`);
  }

  const latestAnalysis = field.soilAnalyses[0];

  return (
    <div className="max-w-6xl pb-20">
      {/* Navigation Header */}
      <header className="mb-8">
        <Link
          href={`/dashboard/propriedades/${field.propertyId}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para {field.property.name}
        </Link>

        <div className="bg-white border-2 border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                <Sprout className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{field.name}</h1>
                <p className="text-slate-500 font-medium text-sm">
                  {field.property.name} • {field.property.city}, {field.property.state}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl text-slate-700 text-xs font-bold">
                <Ruler className="w-4 h-4 text-emerald-600" />
                <span>{field.area} Hectares</span>
              </div>

              {field.crop && (
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-emerald-700 text-xs font-bold uppercase">
                  <span>Cultura: {field.crop}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl text-blue-700 text-xs font-bold">
                <Database className="w-4 h-4" />
                <span>{field.soilAnalyses.length} {field.soilAnalyses.length === 1 ? 'Análise Registrada' : 'Análises Registradas'}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              href={`/dashboard/analises/novo?fieldId=${field.id}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-main hover:bg-brand-light text-white font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] text-sm"
            >
              <Plus className="w-4 h-4" /> Cadastrar Análise de Solo
            </Link>
          </div>
        </div>
      </header>

      {/* Seção Principal: Análise de Solo da Área */}
      <div className="space-y-8">
        
        {/* Banner do Status Mais Recente */}
        {latestAnalysis && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-6 mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Último Laudo Registrado
                </span>
                <h3 className="text-2xl font-bold text-white">Diagnóstico Agronômico Recente</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Coletado em {format(new Date(latestAnalysis.date), 'dd/MM/yyyy')} • Profundidade: {latestAnalysis.depth}
                </p>
              </div>

              <Link
                href={`/dashboard/analises/${latestAnalysis.id}/planejamento`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-main hover:bg-brand-light text-white text-xs font-bold shadow-lg transition-all"
              >
                <Sparkles className="w-4 h-4" /> Abrir no Motor Agronômico IA →
              </Link>
            </div>

            {/* Grid de Principais Parâmetros Químicos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {latestAnalysis.parameters.slice(0, 6).map((param) => (
                <div key={param.id} className="bg-black/30 border border-slate-700/60 p-3.5 rounded-2xl">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">{param.element}</span>
                  <span className="text-lg font-extrabold text-white font-mono">{param.value}</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">{param.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico Completo de Análises de Solo Deste Talhão */}
        <section className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b-2 border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-main" /> Histórico de Análises de Solo
              </h2>
              <p className="text-slate-500 text-xs font-medium mt-0.5">
                Histórico detalhado de fertilidade registrado exclusivamente para esta área.
              </p>
            </div>
          </div>

          {field.soilAnalyses.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">Nenhuma análise cadastrada para esta área</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6">
                Insira a primeira análise laboratorial deste talhão para acompanhar a evolução de nutrientes e gerar diagnósticos.
              </p>
              <Link
                href={`/dashboard/analises/novo?fieldId=${field.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-main hover:bg-brand-light text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> Cadastrar Primeira Análise
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {field.soilAnalyses.map((analysis, index) => {
                const paramMap: Record<string, number | string> = {};
                analysis.parameters?.forEach((p) => (paramMap[p.element] = p.value));

                const pH = paramMap["pH"] ?? paramMap["PH"] ?? "-";
                const V = paramMap["V%"] ?? paramMap["V"] ?? paramMap["V_percent"] ?? "-";
                const P = paramMap["P"] ?? "-";
                const K = paramMap["K"] ?? "-";
                const argila = analysis.physicalChars?.argila ?? "-";

                return (
                  <div
                    key={analysis.id}
                    className="bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:border-brand-main transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 shadow-sm">
                        #{field.soilAnalyses.length - index}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-base">
                            Coleta em {format(new Date(analysis.date), 'dd/MM/yyyy')}
                          </span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                              Mais Recente
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs font-medium">
                          Profundidade: <strong className="text-slate-700">{analysis.depth}</strong> • Cultura Anterior: <strong className="text-slate-700">{analysis.culturaAnterior || 'N/A'}</strong> • Meta: <strong className="text-slate-700">{analysis.culturaDesejada || 'N/A'}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Resumo Nutricional */}
                    <div className="flex items-center gap-4 text-xs font-mono bg-white p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase font-sans">pH</span>
                        <strong className="text-slate-800">{pH}</strong>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase font-sans">V%</span>
                        <strong className="text-slate-800">{V}%</strong>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase font-sans">P</span>
                        <strong className="text-slate-800">{P} mg</strong>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase font-sans">K</span>
                        <strong className="text-slate-800">{K}</strong>
                      </div>
                      <div className="w-px h-6 bg-slate-200" />
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase font-sans">Argila</span>
                        <strong className="text-slate-800">{argila}%</strong>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/dashboard/analises/${analysis.id}/planejamento`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-main hover:bg-brand-light text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Motor IA
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
