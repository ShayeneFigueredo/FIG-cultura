import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";

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
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar
        user={{
          name: dbUser?.name ?? session.user.name ?? "Usuário",
          email: dbUser?.email ?? session.user.email ?? "",
          avatarUrl: dbUser?.avatarUrl,
        }}
      />
      <main className="flex-1 min-w-0 lg:ml-64 min-h-screen relative flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-main/10 via-black to-black opacity-50 pointer-events-none" />
        <div className="relative z-10 p-4 sm:p-8 flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </main>
    </div>
  );
}
