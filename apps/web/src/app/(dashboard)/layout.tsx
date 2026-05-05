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

  const [unreadCount, followData] = await Promise.all([
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        _count: { select: { followers: true, following: true } },
      },
    }),
  ]);

  const followingCount = followData?._count.following ?? 0;
  const followersCount = followData?._count.followers ?? 0;

  return (
    <DashboardShell
      role={session.user.role as string}
      name={session.user.name ?? "Usuario"}
      plan={session.user.plan ?? "FREE"}
      unreadNotifications={unreadCount}
      followingCount={followingCount}
      followersCount={followersCount}
    >
      {children}
    </DashboardShell>
  );
}
