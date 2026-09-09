import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { SettingsMenu } from "@/components/dashboard/SettingsMenu";
import { SubscriptionGuard } from "@/components/dashboard/SubscriptionGuard";

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
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      createdAt: true,
    },
  });

  const subscriptionStatus = dbUser?.role === "ADMIN" ? "ACTIVE" : (dbUser?.subscriptionStatus || "TRIAL");
  const subscriptionEndsAt = dbUser?.subscriptionEndsAt ? dbUser.subscriptionEndsAt.toISOString() : null;
  const createdAt = dbUser?.createdAt ? dbUser.createdAt.toISOString() : new Date().toISOString();

  return (
    <SubscriptionGuard
      subscriptionStatus={subscriptionStatus}
      subscriptionEndsAt={subscriptionEndsAt}
      createdAt={createdAt}
    >
      <div className="min-h-screen bg-slate-50 text-slate-900 flex">
        <Sidebar
          user={{
            name: dbUser?.name ?? session.user.name ?? "Usuário",
            email: dbUser?.email ?? session.user.email ?? "",
            avatarUrl: dbUser?.avatarUrl,
          }}
          subscription={{
            status: subscriptionStatus,
            endsAt: subscriptionEndsAt,
            createdAt: createdAt,
          }}
        />
        <main className="flex-1 min-w-0 lg:ml-64 min-h-screen relative flex flex-col">
          <SettingsMenu />
          <div className="relative z-10 p-4 sm:p-8 flex-1 flex flex-col min-h-0 pt-16 sm:pt-8">
            {children}
          </div>
        </main>
      </div>
    </SubscriptionGuard>
  );
}
