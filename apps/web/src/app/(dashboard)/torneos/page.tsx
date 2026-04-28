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

  const statusConfig: Record<string, { label: string; dot: string; text: string }> = {
    DRAFT:        { label: "Borrador",    dot: "bg-gray-300",   text: "text-gray-500" },
    REGISTRATION: { label: "Inscripción", dot: "bg-blue-400",   text: "text-blue-600" },
    IN_PROGRESS:  { label: "En curso",    dot: "bg-green-400",  text: "text-green-600" },
    FINISHED:     { label: "Finalizado",  dot: "bg-gray-300",   text: "text-gray-400" },
  };

  const formatLabel: Record<string, string> = {
    GROUPS_AND_KNOCKOUT: "Grupos + Eliminatoria",
    SINGLE_ELIMINATION:  "Eliminación directa",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Torneos</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {torneos.length} torneo{torneos.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/torneos/nuevo"
            className="inline-flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
          >
            <span className="text-lg leading-none mb-0.5">+</span>
            Nuevo torneo
          </Link>
        )}
      </div>

      {torneos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🃏</div>
          <p className="text-gray-500 font-medium">No hay torneos todavía</p>
          {isAdmin && (
            <Link href="/torneos/nuevo" className="mt-3 text-sm text-red-600 hover:underline font-medium">
              Crear el primer torneo →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {torneos.map((t) => {
            const sc = statusConfig[t.status];
            return (
              <Link
                key={t.id}
                href={`/torneos/${t.id}`}
                className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all"
              >
                {/* Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </div>
                  <span className="text-xs text-gray-300">
                    {formatLabel[t.format]}
                  </span>
                </div>

                {/* Title */}
                <h2 className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors mb-4 leading-snug">
                  {t.name}
                </h2>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-400 border-t border-gray-50 pt-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t._count.teams} equipos
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t._count.matches} partidos
                  </span>
                  <span className="ml-auto text-xs truncate">{t.admin.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
