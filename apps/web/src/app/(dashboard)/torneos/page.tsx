import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";
import { FREE_TOURNAMENT_LIMIT, isOrganizer, canCreateTournament } from "@/lib/tournament-auth";
import { TorneosFilter } from "@/components/ui/TorneosFilter";

export default async function TorneosPage() {
  const session = await getServerSession(authOptions);
  const canCreate = canCreateTournament(session);
  const canOrganize = isOrganizer(session?.user?.role ?? "");
  const isSuperAdmin = session?.user?.role === "ADMIN";
  const userId = session?.user?.id;

  const torneos = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    where: isSuperAdmin
      ? undefined
      : { OR: [{ status: { not: "DRAFT" } }, ...(userId ? [{ adminId: userId }] : [])] },
    include: {
      admin: { select: { id: true, name: true } },
      _count: { select: { teams: true, matches: true } },
    },
  });

  const myTournamentCount = userId
    ? torneos.filter((t) => t.adminId === userId).length
    : 0;
  const atLimit = !canOrganize && myTournamentCount >= FREE_TOURNAMENT_LIMIT;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Torneos</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {torneos.length} torneo{torneos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {canCreate && (
          <div className="flex flex-col items-end gap-1">
            {atLimit ? (
              <span
                className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-sm font-semibold cursor-not-allowed"
                title={`Límite de ${FREE_TOURNAMENT_LIMIT} torneos para el plan gratuito`}
              >
                <span className="text-lg leading-none mb-0.5">+</span>
                Nuevo torneo
              </span>
            ) : (
              <Link
                href="/torneos/nuevo"
                className="inline-flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                <span className="text-lg leading-none mb-0.5">+</span>
                Nuevo torneo
              </Link>
            )}
            {!canOrganize && (
              <span className="text-xs text-gray-400">
                {myTournamentCount}/{FREE_TOURNAMENT_LIMIT} torneos usados
              </span>
            )}
          </div>
        )}
      </div>

      <TorneosFilter torneos={torneos} />
    </div>
  );
}
