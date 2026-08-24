import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Map, Plus, Ruler, Tractor, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TeamManager } from "@/components/dashboard/TeamManager";

async function createField(propertyId: string, formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const name = (formData.get("name") as string)?.trim();
  const area = parseFloat(formData.get("area") as string);
  const crop = (formData.get("crop") as string)?.trim() || null;

  if (!name || Number.isNaN(area) || area <= 0) {
    return;
  }

  // Garante que a propriedade pertence ao usuário logado
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId: session.user.id },
  });

  if (!property) {
    redirect("/dashboard/propriedades");
  }

  await prisma.field.create({
    data: { name, area, crop, propertyId }
  });

  revalidatePath(`/dashboard/propriedades/${propertyId}`);
}

export default async function PropriedadeDetalhes({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const property = await prisma.property.findFirst({
    where: { id, userId: session.user.id },
    include: { 
      fields: { orderBy: { createdAt: 'desc' } },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true }
          }
        }
      }
    }
  });

  if (!property) {
    redirect("/dashboard/propriedades");
  }

  return (
    <div className="max-w-5xl">
      <header className="mb-10">
        <Link href="/dashboard/propriedades" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar para Fazendas
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-main/20 flex items-center justify-center border border-brand-main/30">
            <Map className="w-6 h-6 text-brand-main" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">{property.name}</h1>
            <p className="text-white/60">{property.city}, {property.state} • {property.totalArea} ha totais</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Formulário de Talhão */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl lg:sticky lg:top-8">
            <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-main" /> Novo Talhão
            </h2>
            <form action={createField.bind(null, property.id)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Nome/Identificador</label>
                <input required type="text" name="name" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="Ex: Talhão 01, Gleba A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Área (ha)</label>
                <input required type="number" step="0.1" min="0.1" name="area" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="Ex: 50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Cultura Atual (Opcional)</label>
                <input type="text" name="crop" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="Ex: Soja, Milho" />
              </div>
              <button type="submit" className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all active:scale-[0.98]">
                Adicionar Talhão
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Talhões */}
        <div className="lg:col-span-2 space-y-4">
          {property.fields.length === 0 ? (
            <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-12 text-center text-white/50">
              <Ruler className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum talhão registrado nesta propriedade.</p>
              <p className="text-sm mt-2">Comece adicionando o primeiro talhão ao lado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {property.fields.map(field => (
                <div key={field.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl group hover:border-white/20 transition-colors relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-white group-hover:opacity-20 transition-opacity">
                    <Tractor className="w-16 h-16" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1 relative z-10">{field.name}</h3>
                  <div className="flex items-center gap-2 text-brand-main font-medium relative z-10 mb-4">
                    <Ruler className="w-4 h-4" /> {field.area} ha
                  </div>

                  {field.crop && (
                    <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 relative z-10">
                      Cultura: {field.crop}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Seção de Gestão da Equipe */}
      <div className="mt-8">
        <TeamManager propertyId={property.id} initialMembers={property.members} />
      </div>

    </div>
  );
}
