import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-4xl">
      <header className="mb-12">
        <h1 className="text-4xl font-semibold mb-2 text-slate-900">
          Visão Geral
        </h1>
        <p className="text-slate-600 text-lg">
          Bem-vindo ao sistema de gestão agronômica da FIG AgroTech.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl relative overflow-hidden group shadow-sm">
          <h3 className="text-2xl font-medium mb-4 relative z-10 text-slate-900">Gestão de Áreas</h3>
          <p className="text-slate-600 mb-8 relative z-10">Cadastre e gerencie propriedades e talhões para seus clientes.</p>
          <Link href="/dashboard/propriedades" className="inline-flex items-center gap-2 text-brand-main font-medium hover:text-brand-accent transition-colors relative z-10">
            Acessar Módulo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="bg-white border border-slate-200 p-8 rounded-3xl relative overflow-hidden group shadow-sm">
          <h3 className="text-2xl font-medium mb-4 relative z-10 text-slate-900">Análise de Solo</h3>
          <p className="text-slate-600 mb-8 relative z-10">Insira resultados laboratoriais e gere recomendações precisas.</p>
          <Link href="/dashboard/analises" className="inline-flex items-center gap-2 text-brand-main font-medium hover:text-brand-accent transition-colors relative z-10">
            Acessar Módulo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-3xl relative overflow-hidden group shadow-sm md:col-span-2">
          <h3 className="text-2xl font-medium mb-4 relative z-10 text-slate-900 flex items-center gap-2">
            Motor Agronômico <span className="text-xs bg-brand-main text-white px-2 py-0.5 rounded-full font-bold">NOVO</span>
          </h3>
          <p className="text-slate-600 mb-8 relative z-10 max-w-2xl">
            Utilize a inteligência artificial para ler análises, classificar nutrientes automaticamente e gerar relatórios de necessidade de calagem e adubação para qualquer cultura.
          </p>
          <Link href="/dashboard/motor" className="inline-flex items-center gap-2 bg-brand-main text-white font-medium hover:bg-brand-accent px-5 py-2.5 rounded-xl transition-colors relative z-10">
            Abrir Motor IA <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
