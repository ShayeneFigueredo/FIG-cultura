import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MapPin, Plus, Sprout, ChevronRight } from "lucide-react";
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
          <h1 className="text-3xl font-semibold mb-2">Gestão de Áreas</h1>
          <p className="text-white/60">Cadastre suas fazendas e os talhões correspondentes.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Formulário de Criação */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl lg:sticky lg:top-8">
            <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-main" /> Nova Fazenda
            </h2>
            <form action={createProperty} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Nome da Propriedade</label>
                <input required type="text" name="name" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="Ex: Fazenda Santa Cruz" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Cidade</label>
                  <input required type="text" name="city" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="Ex: Uberaba" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Estado</label>
                  <input required type="text" name="state" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="MG" maxLength={2} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Área Total (ha)</label>
                <input required type="number" step="0.1" min="0.1" name="totalArea" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="Ex: 1500" />
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
            <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-12 text-center text-white/50">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma propriedade cadastrada ainda.</p>
              <p className="text-sm mt-2">Use o formulário ao lado para começar.</p>
            </div>
          ) : (
            properties.map(prop => (
              <div key={prop.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl group hover:border-brand-main/50 transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-medium text-white">{prop.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-white/60 mt-2">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {prop.city}, {prop.state}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{prop.totalArea} hectares</span>
                    </div>
                  </div>
                  <Link href={`/dashboard/propriedades/${prop.id}`} className="p-2 rounded-full bg-white/5 text-white hover:bg-brand-main hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Sprout className="w-4 h-4 text-brand-main" />
                      <span className="text-white/80">{prop.fields.length} Talhões cadastrados</span>
                    </div>
                    <Link href={`/dashboard/propriedades/${prop.id}`} className="text-sm font-medium text-brand-main hover:text-brand-light">
                      Gerenciar Talhões
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
