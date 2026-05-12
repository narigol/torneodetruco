import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { DashboardShell } from "@/components/ui/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return (
    <DashboardShell
      role={session.user.role as string}
      name={session.user.name ?? "Usuario"}
      plan={session.user.plan ?? "FREE"}
      unreadNotifications={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
