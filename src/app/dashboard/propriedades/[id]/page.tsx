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
        <Link href="/dashboard/propriedades" className="inline-flex items-center gap-2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar para Fazendas
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-main/20 flex items-center justify-center border border-brand-main/30">
            <Map className="w-6 h-6 text-brand-main" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">{property.name}</h1>
            <div className="flex items-center gap-4 text-black/60 dark:text-white/60 mt-1">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {property.city}, {property.state}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
              <span>{property.totalArea} hectares</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Formulário de Talhão */}
        <div className="lg:col-span-1">
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-6 rounded-2xl sticky top-8">
            <h2 className="text-xl font-medium mb-6 flex items-center gap-2 text-black dark:text-white">
              <Plus className="w-5 h-5 text-brand-main" /> Novo Talhão
            </h2>
            <form action={createField.bind(null, property.id)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1">Nome/Identificador</label>
                <input required type="text" name="name" className="w-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="Ex: Talhão 01, Gleba A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1">Área (ha)</label>
                <input required type="number" step="0.1" min="0.1" name="area" className="w-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="Ex: 50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-black/70 dark:text-white/70 mb-1">Cultura Atual (Opcional)</label>
                <input type="text" name="crop" className="w-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-black dark:text-white placeholder-black/30 dark:placeholder-white/30 focus:outline-none focus:border-brand-main transition-colors" placeholder="Ex: Soja, Milho" />
              </div>
              <button type="submit" className="w-full py-3 px-4 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-black dark:text-white font-medium rounded-xl transition-all active:scale-[0.98]">
                Adicionar Talhão
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Talhões */}
        <div className="lg:col-span-2 space-y-4">
          {property.fields.length === 0 ? (
            <div className="text-center py-12 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl border-dashed">
              <Sprout className="w-12 h-12 text-black/20 dark:text-white/20 mx-auto mb-4" />
              <p className="text-black/60 dark:text-white/60">Nenhum talhão cadastrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {property.fields.map(field => (
                <div key={field.id} className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-6 rounded-2xl hover:border-brand-main/50 transition-colors group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-black dark:text-white mb-2 group-hover:text-brand-main transition-colors">{field.name}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-black/60 dark:text-white/60">
                        <div className="flex items-center gap-1 text-brand-main">
                          <Ruler className="w-4 h-4" /> {field.area} ha
                        </div>
                        {field.crop && (
                          <span className="px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-xs">
                            {field.crop}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
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
