import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export const metadata = {
  title: "Meu Perfil | Cultiva",
};

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  // Busca os dados atualizados do banco
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      avatarUrl: true,
    }
  });

  if (!user) {
    redirect("/");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Meu Perfil</h1>
        <p className="text-slate-600 font-medium">
          Gerencie suas informações pessoais e foto de perfil.
        </p>
      </header>

      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <ProfileForm user={{ ...user, avatarUrl: user.avatarUrl ?? "" }} />
        </div>
      </div>
    </div>
  );
}
