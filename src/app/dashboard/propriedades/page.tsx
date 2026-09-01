import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MapPin, Plus, Sprout, ChevronRight, Map, ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function createProperty(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const name = (formData.get("name") as string)?.trim();
  const city = (formData.get("city") as string)?.trim();
  const state = (formData.get("state") as string)?.trim().toUpperCase();
  const totalArea = parseFloat(formData.get("totalArea") as string);

  if (!name || !city || !state || Number.isNaN(totalArea) || totalArea <= 0) {
    return;
  }

  await prisma.property.create({
    data: { name, city, state, totalArea, userId: session.user.id },
  });

  revalidatePath("/dashboard/propriedades");
}

export default async function PropriedadesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const properties = await prisma.property.findMany({
    where: { userId: session.user.id },
    include: { fields: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-5xl">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-semibold mb-2 text-black dark:text-white">Gestão de Áreas</h1>
          <p className="text-black/60 dark:text-white/60">Cadastre suas fazendas e os talhões correspondentes.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Formulário de Criação */}
        <div className="lg:col-span-1">
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-6 rounded-2xl lg:sticky lg:top-8">
            <h2 className="text-xl font-medium mb-6 flex items-center gap-2 text-black dark:text-white">
              <Plus className="w-5 h-5 text-brand-main" /> Nova Fazenda
            </h2>
            <form action={createProperty} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1">Nome da Propriedade</label>
                <input required type="text" name="name" className="w-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="Ex: Fazenda Santa Cruz" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1">Cidade</label>
                  <input required type="text" name="city" className="w-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="Ex: Uberaba" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1">Estado</label>
                  <input required type="text" name="state" className="w-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="MG" maxLength={2} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1">Área Total (ha)</label>
                <input required type="number" step="0.1" min="0.1" name="totalArea" className="w-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="Ex: 1500" />
              </div>
              <button type="submit" className="w-full py-3 px-4 bg-brand-main hover:bg-brand-light text-white font-medium rounded-xl transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(107,175,58,0.2)]">
                Cadastrar Fazenda
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Fazendas */}
        <div className="lg:col-span-2 space-y-4">
          {properties.length === 0 ? (
            <div className="text-center py-12 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl border-dashed">
              <Map className="w-12 h-12 text-black/20 dark:text-white/20 mx-auto mb-4" />
              <p className="text-black/60 dark:text-white/60">Nenhuma fazenda cadastrada.</p>
            </div>
          ) : (
            properties.map((prop) => (
              <div key={prop.id} className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-6 rounded-2xl hover:border-brand-main/50 transition-colors group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-black dark:text-white mb-1 group-hover:text-brand-main transition-colors">{prop.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-black/50 dark:text-white/50">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {prop.city}, {prop.state}</span>
                      <span className="w-1 h-1 rounded-full bg-black/20 dark:bg-white/20" />
                      <span>{prop.totalArea} hectares</span>
                    </div>
                  </div>
                  <Link href={`/dashboard/propriedades/${prop.id}`} className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-black/70 dark:text-white/70 hover:bg-brand-main hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>

                <div className="pt-4 border-t border-black/10 dark:border-white/10">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg text-black/70 dark:text-white/70">
                      <Sprout className="w-4 h-4 text-brand-main" />
                      <span>{prop.fields.length} {prop.fields.length === 1 ? 'Talhão cadastrado' : 'Talhões cadastrados'}</span>
                    </div>
                    
                    <Link 
                      href={`/dashboard/propriedades/${prop.id}`}
                      className="inline-flex items-center gap-2 text-brand-main font-medium hover:text-brand-light transition-colors"
                    >
                      Gerenciar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
