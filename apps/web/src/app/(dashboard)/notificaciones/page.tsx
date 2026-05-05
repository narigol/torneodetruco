import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import { MarkReadButton } from "@/components/ui/MarkReadButton";
import { NotificationItem } from "@/components/ui/NotificationItem";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function NotificacionesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      tournament: {
        select: { id: true, name: true, admin: { select: { name: true } } },
      },
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">{unreadCount} sin leer</p>
          )}
        </div>
        {unreadCount > 0 && <MarkReadButton />}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          message="No tenés notificaciones todavía"
          submessage="Seguí a organizadores desde un torneo para enterarte de sus novedades"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              id={n.id}
              type={n.type}
              read={n.read}
              createdAt={n.createdAt.toISOString()}
              message={n.message ?? null}
              tournament={n.tournament}
            />
          ))}
        </div>
      )}
    </div>
  );
}
