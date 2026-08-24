import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-4xl">
      <header className="mb-12">
        <h1 className="text-4xl font-semibold mb-2">
          Visão Geral
        </h1>
        <p className="text-white/60 text-lg">
          Bem-vindo ao sistema de gestão agronômica da FIG AgroTech.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-main/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-2xl font-medium mb-4 relative z-10">Gestão de Áreas</h3>
          <p className="text-white/60 mb-8 relative z-10">Cadastre e gerencie propriedades e talhões para seus clientes.</p>
          <Link href="/dashboard/propriedades" className="inline-flex items-center gap-2 text-brand-main font-medium hover:text-brand-light transition-colors relative z-10">
            Acessar Módulo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-bl from-brand-main/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-2xl font-medium mb-4 relative z-10">Análise de Solo</h3>
          <p className="text-white/60 mb-8 relative z-10">Insira resultados laboratoriais e gere recomendações precisas.</p>
          <Link href="/dashboard/analises" className="inline-flex items-center gap-2 text-brand-main font-medium hover:text-brand-light transition-colors relative z-10">
            Acessar Módulo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white/5 border border-brand-main/30 p-8 rounded-3xl relative overflow-hidden group shadow-[0_0_15px_rgba(107,175,58,0.1)] md:col-span-2">
          <div className="absolute inset-0 bg-gradient-to-t from-brand-main/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-2xl font-medium mb-4 relative z-10 text-brand-main flex items-center gap-2">
            Motor Agronômico <span className="text-xs bg-brand-main text-white px-2 py-0.5 rounded-full font-bold">NOVO</span>
          </h3>
          <p className="text-white/60 mb-8 relative z-10 max-w-2xl">
            Utilize a inteligência artificial para ler análises, classificar nutrientes automaticamente e gerar relatórios de necessidade de calagem e adubação para qualquer cultura.
          </p>
          <Link href="/dashboard/motor" className="inline-flex items-center gap-2 bg-brand-main/20 text-brand-main font-medium hover:bg-brand-main hover:text-white px-5 py-2.5 rounded-xl transition-colors relative z-10">
            Abrir Motor IA <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
