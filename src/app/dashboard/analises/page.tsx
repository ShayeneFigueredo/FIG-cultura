import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Database } from "lucide-react";
import DataGrid from "@/components/analises/DataGrid";
import { ExportCsvButton } from "@/components/analises/ExportCsvButton";
import type { GridAnalysis } from "@/components/analises/types";

export default async function AnalisesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  // Busca todas as análises com dados relacionados para a planilha
  const analyses = await prisma.soilAnalysis.findMany({
    where: {
      field: {
        property: {
          userId: session.user.id,
        },
      },
    },
    include: {
      field: {
        include: { property: true },
      },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 px-6 lg:px-12">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Análises de Solo</h1>
          <p className="text-white/60">Controle de fertilidade, diagnósticos e planejamento de safra.</p>
        </div>
        <div className="flex gap-4">
          {analyses.length > 0 && <ExportCsvButton analyses={analyses as unknown as GridAnalysis[]} />}
          <Link href="/dashboard/analises/novo" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-main hover:bg-brand-light text-white font-medium transition-all shadow-[0_0_15px_rgba(107,175,58,0.2)]">
            <Plus className="w-4 h-4" /> Nova Análise
          </Link>
        </div>
      </header>

      {analyses.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-white/10 border-dashed rounded-3xl mx-6 lg:mx-12 p-12 bg-white/5">
          <Database className="w-16 h-16 text-white/20 mb-4" />
          <h2 className="text-xl font-medium mb-2">Nenhuma análise encontrada</h2>
          <p className="text-white/50 mb-6 max-w-md text-center">
            Comece inserindo os dados da sua primeira análise de solo para gerar diagnósticos e planejamento.
          </p>
          <Link href="/dashboard/analises/novo" className="px-6 py-3 rounded-xl bg-brand-main hover:bg-brand-light text-white font-medium transition-all">
            Adicionar Primeira Análise
          </Link>
        </div>
      ) : (
        <div className="flex-1 w-full min-h-0 overflow-hidden px-6 lg:px-12 pb-12">
          <DataGrid analyses={analyses as unknown as GridAnalysis[]} />
        </div>
      )}
    </div>
  );
}
