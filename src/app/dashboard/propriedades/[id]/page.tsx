import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Map, Plus, Ruler, Sprout, MapPin } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TeamManager } from "@/components/dashboard/TeamManager";
import FieldMapGis from "@/components/gis/FieldMapGis";

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
    data: { name, area, crop, propertyId },
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
      fields: {
        orderBy: { createdAt: "desc" },
        include: {
          soilAnalyses: {
            orderBy: { date: "desc" },
            take: 1,
            include: { parameters: true, recommendations: true },
          },
        },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (!property) {
    redirect("/dashboard/propriedades");
  }

  const gisFields = property.fields.map((field) => {
    const latest = field.soilAnalyses[0];
    const getVal = (el: string) =>
      latest?.parameters.find((p) => p.element.toUpperCase() === el.toUpperCase())?.value;
    const vVal = getVal("V_PERCENT") ?? getVal("V%") ?? getVal("V");
    const pVal = getVal("P");
    const kVal = getVal("K");
    const phVal = getVal("PH");
    const limingRec = latest?.recommendations.find((r) => r.nutrient === "Calcario");

    return {
      id: field.id,
      name: field.name,
      area: field.area,
      crop: field.crop,
      coordinates: (field.coordinates as unknown as [number, number][]) || undefined,
      latestAnalysis: latest
        ? {
            id: latest.id,
            vPercent: vVal ?? null,
            ph: phVal ?? null,
            p: pVal ?? null,
            k: kVal ?? null,
            limingNeeded: (limingRec?.recommendedDose || 0) > 0,
            date: latest.date.toISOString(),
          }
        : null,
    };
  });

  return (
    <div className="max-w-6xl pb-20">
      <header className="mb-8">
        <Link
          href="/dashboard/propriedades"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Fazendas
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center shrink-0">
              <Map className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{property.name}</h1>
              <div className="flex items-center gap-4 text-slate-600 font-medium mt-1 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-500" /> {property.city}, {property.state}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span>{property.totalArea} hectares</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mapa GIS de Talhões e Fertilidade Satélite */}
      <section className="mb-10">
        <FieldMapGis
          propertyName={property.name}
          city={property.city}
          state={property.state}
          fields={gisFields}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Talhão */}
        <div className="lg:col-span-1">
          <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl sticky top-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
              <Plus className="w-5 h-5 text-brand-main" /> Novo Talhão
            </h2>
            <form action={createField.bind(null, property.id)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                  Nome/Identificador
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  className="w-full !bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 !text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-main font-semibold shadow-sm"
                  placeholder="Ex: Talhão 01, Gleba A"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                  Área (ha)
                </label>
                <input
                  required
                  type="number"
                  step="0.1"
                  min="0.1"
                  name="area"
                  className="w-full !bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 !text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-main font-semibold shadow-sm"
                  placeholder="Ex: 50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                  Cultura Atual (Opcional)
                </label>
                <input
                  type="text"
                  name="crop"
                  className="w-full !bg-white border-2 border-slate-300 rounded-xl px-4 py-2.5 !text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-main font-semibold shadow-sm"
                  placeholder="Ex: Soja, Milho"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-brand-main hover:bg-brand-light text-white font-semibold rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                Adicionar Talhão
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Talhões */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Talhões Cadastrados ({property.fields.length})
          </h2>
          {property.fields.length === 0 ? (
            <div className="text-center py-12 bg-white border-2 border-slate-200 rounded-3xl border-dashed shadow-sm">
              <Sprout className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Nenhum talhão cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {property.fields.map((field) => {
                const latest = field.soilAnalyses[0];
                return (
                  <Link
                    key={field.id}
                    href={`/dashboard/propriedades/${property.id}/talhoes/${field.id}`}
                    className="bg-white border-2 border-slate-200 p-6 rounded-3xl hover:border-brand-main hover:shadow-md transition-all shadow-sm group flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-main transition-colors">
                          {field.name}
                        </h3>
                        {field.crop && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold capitalize">
                            {field.crop}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 font-medium text-sm mb-4">
                        <Ruler className="w-4 h-4 text-emerald-600" /> {field.area} hectares
                      </div>
                    </div>

                    <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        {latest ? `1 Análise Registrada` : 'Sem análise cadastrada'}
                      </span>
                      <span className="text-xs font-bold text-brand-main group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Acessar Área →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Seção de Gestão da Equipe */}
      <div className="mt-10">
        <TeamManager propertyId={property.id} initialMembers={property.members} />
      </div>
    </div>
  );
}
