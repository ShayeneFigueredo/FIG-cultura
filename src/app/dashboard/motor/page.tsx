import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calculator, ArrowRight, Sprout, Database } from "lucide-react";

export default async function MotorAgronomicoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const analyses = await prisma.soilAnalysis.findMany({
    where: { field: { property: { userId: session.user.id } } },
    include: { field: { include: { property: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-5xl">
      <header className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center shrink-0">
            <Calculator className="w-8 h-8 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2 text-slate-900">Motor Agronômico IA</h1>
            <p className="text-slate-600 text-lg font-medium">Inteligência artificial para planejamento e recomendação de adubação.</p>
          </div>
        </div>
      </header>

      {analyses.length === 0 ? (
        <div className="border-2 border-slate-200 border-dashed rounded-3xl p-12 bg-white text-center shadow-sm">
          <Database className="w-16 h-16 text-slate-300 mb-4 mx-auto" />
          <h2 className="text-xl font-bold mb-2 text-slate-900">Nenhuma Análise Disponível</h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto font-medium">
            Para utilizar o Motor Agronômico, você precisa ter análises de solo cadastradas no sistema.
          </p>
          <Link href="/dashboard/analises/novo" className="px-6 py-3 rounded-xl bg-brand-main hover:bg-brand-light text-white font-semibold inline-block transition-all shadow-md">
            Cadastrar Primeira Análise
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-bold mb-4 text-slate-900">Selecione uma análise para gerar o planejamento:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.map(analysis => (
              <Link 
                key={analysis.id} 
                href={`/dashboard/analises/${analysis.id}/planejamento`}
                className="group relative bg-white border-2 border-slate-200 p-6 rounded-2xl hover:border-brand-main shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 mb-3">
                    <Sprout className="w-5 h-5" />
                    <span className="font-bold text-sm">Pronta para IA</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{analysis.field.name}</h3>
                  <p className="text-sm text-slate-600 font-medium mb-4">{analysis.field.property.name}</p>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">
                    {new Date(analysis.date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center gap-1 text-brand-main font-bold text-sm group-hover:translate-x-1 transition-transform">
                    Rodar Motor <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
