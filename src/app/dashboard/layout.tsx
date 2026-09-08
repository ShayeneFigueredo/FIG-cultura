import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SettingsMenu } from "@/components/dashboard/SettingsMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, avatarUrl: true },
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar
        user={{
          name: dbUser?.name ?? session.user.name ?? "Usuário",
          email: dbUser?.email ?? session.user.email ?? "",
          avatarUrl: dbUser?.avatarUrl,
        }}
      />
      <main className="flex-1 min-w-0 lg:ml-64 min-h-screen relative flex flex-col">
        <SettingsMenu />
        <div className="relative z-10 p-4 sm:p-8 flex-1 flex flex-col min-h-0 pt-16 sm:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
