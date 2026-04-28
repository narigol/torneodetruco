import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";

export default async function TorneosPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const torneos = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      admin: { select: { name: true } },
      _count: { select: { teams: true, matches: true } },
    },
  });

  const statusLabel: Record<string, string> = {
    DRAFT: "Borrador",
    REGISTRATION: "Inscripción",
    IN_PROGRESS: "En curso",
    FINISHED: "Finalizado",
  };

  const statusColor: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    REGISTRATION: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-green-100 text-green-700",
    FINISHED: "bg-gray-100 text-gray-500",
  };

  const formatLabel: Record<string, string> = {
    GROUPS_AND_KNOCKOUT: "Grupos + Eliminatoria",
    SINGLE_ELIMINATION: "Eliminación directa",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Torneos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {torneos.length} torneo{torneos.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/torneos/nuevo"
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            + Nuevo torneo
          </Link>
        )}
      </div>

      {torneos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No hay torneos todavía</p>
          {isAdmin && (
            <Link
              href="/torneos/nuevo"
              className="mt-4 inline-block text-red-600 hover:underline text-sm"
            >
              Crear el primer torneo
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {torneos.map((t) => (
            <Link
              key={t.id}
              href={`/torneos/${t.id}`}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-semibold text-gray-900">{t.name}</h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[t.status]}`}
                >
                  {statusLabel[t.status]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {formatLabel[t.format]}
              </p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>{t._count.teams} equipos</span>
                <span>{t._count.matches} partidos</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Organizado por {t.admin.name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
