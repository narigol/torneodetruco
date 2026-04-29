import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";
import { MarkReadButton } from "@/components/ui/MarkReadButton";

const TYPE_LABEL: Record<string, { text: string; color: string }> = {
  TOURNAMENT_CREATED: { text: "Nuevo torneo",        color: "bg-blue-100 text-blue-700" },
  REGISTRATION_OPEN:  { text: "Inscripción abierta", color: "bg-green-100 text-green-700" },
  TOURNAMENT_STARTED: { text: "Torneo iniciado",     color: "bg-amber-100 text-amber-700" },
  TOURNAMENT_FINISHED:{ text: "Torneo finalizado",   color: "bg-gray-100 text-gray-600" },
};

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
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-gray-400 text-sm">No tenés notificaciones todavía</p>
          <p className="text-gray-300 text-xs mt-1">
            Seguí a organizadores desde un torneo para enterarte de sus novedades
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = TYPE_LABEL[n.type] ?? { text: n.type, color: "bg-gray-100 text-gray-600" };
            return (
              <Link
                key={n.id}
                href={n.tournament ? `/torneos/${n.tournament.id}` : "/notificaciones"}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors hover:border-gray-200 ${
                  n.read ? "bg-white border-gray-100" : "bg-blue-50/40 border-blue-100"
                }`}
              >
                {!n.read && (
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                )}
                {n.read && <span className="mt-1.5 w-2 h-2 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                      {cfg.text}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {n.tournament && (
                    <>
                      <p className="text-sm font-medium text-gray-900 truncate">{n.tournament.name}</p>
                      <p className="text-xs text-gray-400">por {n.tournament.admin.name}</p>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
