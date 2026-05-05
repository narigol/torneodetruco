import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { Sidebar } from "@/components/ui/Sidebar";

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
    <div className="flex h-screen bg-[#f6f5f3]">
      <Sidebar
        role={session.user.role as string}
        name={session.user.name ?? "Usuario"}
        plan={session.user.plan ?? "FREE"}
        unreadNotifications={unreadCount}
        followingCount={followingCount}
        followersCount={followersCount}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
