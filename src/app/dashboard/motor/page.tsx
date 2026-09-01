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
          <div className="w-16 h-16 rounded-2xl bg-brand-main/20 flex items-center justify-center border border-brand-main/30 shadow-[0_0_20px_rgba(107,175,58,0.2)]">
            <Calculator className="w-8 h-8 text-brand-main" />
          </div>
          <div>
            <h1 className="text-4xl font-semibold mb-2 text-black dark:text-white">Motor Agronômico IA</h1>
            <p className="text-black/60 dark:text-white/60 text-lg">Inteligência artificial para planejamento e recomendação de adubação.</p>
          </div>
        </div>
      </header>

      {analyses.length === 0 ? (
        <div className="border border-black/10 dark:border-white/10 border-dashed rounded-3xl p-12 bg-black/5 dark:bg-white/5 text-center text-black dark:text-white">
          <Database className="w-16 h-16 text-black/20 dark:text-white/20 mb-4 mx-auto" />
          <h2 className="text-xl font-medium mb-2 text-black dark:text-white">Nenhuma Análise Disponível</h2>
          <p className="text-black/50 dark:text-white/50 mb-6 max-w-md mx-auto">
            Para utilizar o Motor Agronômico, você precisa ter análises de solo cadastradas no sistema.
          </p>
          <Link href="/dashboard/analises/novo" className="px-6 py-3 rounded-xl bg-brand-main hover:bg-brand-light text-white font-medium inline-block transition-all">
            Cadastrar Primeira Análise
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-medium mb-4 text-black dark:text-white">Selecione uma análise para gerar o planejamento:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.map(analysis => (
              <Link 
                key={analysis.id} 
                href={`/dashboard/analises/${analysis.id}/planejamento`}
                className="group relative bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-6 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 hover:border-brand-main/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-brand-main mb-3">
                    <Sprout className="w-5 h-5" />
                    <span className="font-medium text-sm">Pronta para IA</span>
                  </div>
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-1">{analysis.field.name}</h3>
                  <p className="text-sm text-black/50 dark:text-white/50 mb-4">{analysis.field.property.name}</p>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/10 dark:border-white/10">
                  <div className="text-xs text-black/40 dark:text-white/40">
                    {new Date(analysis.date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center gap-1 text-brand-main font-medium text-sm group-hover:translate-x-1 transition-transform">
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
