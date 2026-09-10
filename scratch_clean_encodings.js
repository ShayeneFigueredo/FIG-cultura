const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '..', 'site', 'src', 'components');

const navbarCode = `import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, ChevronRight } from 'lucide-react';

interface NavbarProps {
  onOpenContact: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenContact }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${
      scrolled 
        ? 'bg-[#1A1A1A] border-b border-white/10 py-3 shadow-lg' 
        : 'bg-[#1A1A1A]/95 backdrop-blur-md py-4 border-b border-white/10'
    }\`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo Brand */}
          <a href="#" className="flex items-center gap-3 group">
            <img 
              src="/logo-branco.png" 
              alt="FIG AgroTech" 
              className="h-9 sm:h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#sobre" className="text-sm font-semibold text-slate-200 hover:text-[#93C83E] transition-colors">
              Sobre Nós
            </a>
            <a href="#cultiva" className="text-sm font-semibold text-slate-200 hover:text-[#93C83E] transition-colors flex items-center gap-1.5">
              <span>Plataforma Cultiva</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#93C83E]/20 text-[#93C83E] border border-[#93C83E]/30 rounded-full">IA</span>
            </a>
            <a href="#tecnologia" className="text-sm font-semibold text-slate-200 hover:text-[#93C83E] transition-colors">
              Tecnologia 5ª Aproximação
            </a>
            <a href="#calculadora" className="text-sm font-semibold text-slate-200 hover:text-[#93C83E] transition-colors">
              Simulador ROI
            </a>
            <a href="#planos" className="text-sm font-semibold text-slate-200 hover:text-[#93C83E] transition-colors">
              Planos
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={onOpenContact}
              className="text-sm font-semibold text-slate-200 hover:text-white px-4 py-2 rounded-xl transition-colors"
            >
              Falar com Consultor
            </button>
            
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6BAF3A] hover:bg-[#93C83E] text-white hover:text-[#1A1A1A] text-sm font-bold shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <span>Acessar Cultiva</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1A1A1A] border-b border-white/10 px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3">
            <a 
              href="#sobre" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-200 hover:text-[#93C83E] py-2 border-b border-white/10 flex justify-between items-center"
            >
              <span>Sobre a FIG AgroTech</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#cultiva" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-200 hover:text-[#93C83E] py-2 border-b border-white/10 flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <span>Plataforma Cultiva</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[#93C83E]/20 text-[#93C83E] rounded-full">IA</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#tecnologia" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-200 hover:text-[#93C83E] py-2 border-b border-white/10 flex justify-between items-center"
            >
              <span>Tecnologia & 5ª Aproximação</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#calculadora" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-200 hover:text-[#93C83E] py-2 border-b border-white/10 flex justify-between items-center"
            >
              <span>Simulador ROI</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
            <a 
              href="#planos" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-200 hover:text-[#93C83E] py-2 flex justify-between items-center"
            >
              <span>Planos e Assinaturas</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </nav>

          <div className="pt-4 space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              className="w-full py-3 rounded-xl border border-[#6BAF3A]/40 text-[#93C83E] font-semibold text-sm hover:bg-[#6BAF3A]/10 transition-colors"
            >
              Falar com Consultor
            </button>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl bg-[#6BAF3A] hover:bg-[#93C83E] text-white hover:text-[#1A1A1A] font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              Entrar no Cultiva
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
`;

const pricingCode = `import React from 'react';
import { CheckCircle2, Zap, Award, ArrowRight, Star } from 'lucide-react';

interface PricingSectionProps {
  onOpenContact: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenContact }) => {
  return (
    <section id="planos" className="py-24 bg-white text-[#1A1A1A] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#6BAF3A]/10 border border-[#6BAF3A]/30 text-[#6BAF3A] text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-[#6BAF3A]" />
            <span>Investimento Transparente</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1A1A1A] tracking-tight">
            Planos sob Medida para <span className="text-[#6BAF3A]">Seu Negócio Agrícola</span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg">
            Acesso ilimitado à interpretação por IA, motor agronômico e emissão de laudos oficiais.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          
          {/* Card Mensal */}
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-[#1A1A1A]">Plano Mensal</h3>
                <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full">
                  Flexibilidade Total
                </span>
              </div>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-500">R$</span>
                  <span className="text-5xl font-black text-[#1A1A1A] tracking-tight font-mono">99,90</span>
                  <span className="text-slate-500 font-semibold text-sm">/ mês</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Assinatura mensal recorrente via Mercado Pago. Cancele quando quiser.
                </p>
              </div>

              <div className="space-y-3 py-6 border-t border-slate-200 text-sm font-semibold text-slate-700">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#6BAF3A] shrink-0" /> Diagnósticos de Solo Ilimitados com IA
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#6BAF3A] shrink-0" /> Motor NPK & Calagem por Produtividade
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#6BAF3A] shrink-0" /> Emissão de Laudos em PDF A4 Oficial
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#6BAF3A] shrink-0" /> Suporte Técnico por E-mail & Chat
                </div>
              </div>
            </div>

            <a
              href="http://localhost:3000/dashboard/assinatura"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-2xl bg-[#1A1A1A] hover:bg-slate-800 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 mt-6 shadow-sm"
            >
              <span>Assinar Plano Mensal</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Card Anual PRO (Recomendado) */}
          <div className="relative bg-[#1A1A1A] text-white rounded-3xl p-8 border-2 border-[#93C83E] shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#F99D1C] text-[#1A1A1A] font-black text-[10px] px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
              Melhor Valor • 2 Meses Grátis
            </div>

            <div>
              <div className="mb-4">
                <span className="text-xs font-bold text-[#93C83E] uppercase tracking-widest flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#93C83E]" /> Recomendado para Agrônomos
                </span>
                <h3 className="text-2xl font-black text-white mt-1">Plano Anual PRO</h3>
              </div>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-400">R$</span>
                  <span className="text-5xl font-black text-white tracking-tight font-mono">999,90</span>
                  <span className="text-slate-300 font-semibold text-sm">/ ano</span>
                </div>
                <p className="text-xs text-[#93C83E] font-bold mt-2">
                  Equivalente a apenas R$ 83,32 / mês (Economia de R$ 198,90 no ano)
                </p>
              </div>

              <div className="space-y-3 py-6 border-t border-slate-800 text-sm font-semibold text-slate-200">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#93C83E] shrink-0" /> Tudo do Plano Mensal Incluído
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#93C83E] shrink-0" /> Suporte Prioritário VIP via WhatsApp
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#93C83E] shrink-0" /> Acesso Antecipado aos Novos Modelos de IA
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#93C83E] shrink-0" /> Garantia de Tarifa Congelada por 12 Meses
                </div>
              </div>
            </div>

            <a
              href="http://localhost:3000/dashboard/assinatura"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-2xl bg-[#6BAF3A] hover:bg-[#93C83E] text-white hover:text-[#1A1A1A] font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-6"
            >
              <Zap className="w-4 h-4 text-[#F99D1C]" />
              <span>Assinar Anual com Desconto</span>
            </a>
          </div>

        </div>

        {/* Enterprise Callout */}
        <div className="mt-16 max-w-5xl mx-auto bg-slate-50 p-8 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xl font-bold text-[#1A1A1A]">É uma Cooperativa, Usina ou Grande Grupo Agrícola?</h4>
            <p className="text-xs text-slate-600">Oferecemos planos corporativos com integração via API, treinamento de equipes e instâncias dedicadas.</p>
          </div>
          <button
            onClick={onOpenContact}
            className="px-6 py-3.5 rounded-xl border border-[#6BAF3A] text-[#6BAF3A] font-bold text-sm hover:bg-[#6BAF3A]/10 transition-colors whitespace-nowrap"
          >
            Solicitar Proposta Corporativa
          </button>
        </div>

      </div>
    </section>
  );
};
`;

fs.writeFileSync(path.join(targetDir, 'Navbar.tsx'), navbarCode, 'utf8');
fs.writeFileSync(path.join(targetDir, 'PricingSection.tsx'), pricingCode, 'utf8');
console.log('Navbar and PricingSection updated successfully!');
