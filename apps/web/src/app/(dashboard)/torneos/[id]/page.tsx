import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, TournamentFormat } from "@tdt/db";
import Link from "next/link";
import { GroupStandingsTable } from "@/components/tournament/GroupStandingsTable";
import { Bracket } from "@/components/tournament/Bracket";
import { TournamentStatusBadge } from "@/components/tournament/TournamentStatusBadge";
import { TournamentActions } from "@/components/tournament/TournamentActions";

type Props = {
  params: { id: string };
  searchParams: { tab?: string };
};

const TABS = ["equipos", "grupos", "llave"] as const;
type Tab = (typeof TABS)[number];

export default async function TorneoDetailPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      admin: { select: { id: true, name: true } },
      teams: {
        include: {
          teamPlayers: {
            include: { player: { select: { id: true, name: true } } },
          },
        },
        orderBy: { name: "asc" },
      },
      groups: {
        include: {
          standings: {
            include: { team: { select: { id: true, name: true } } },
            orderBy: [{ points: "desc" }, { wins: "desc" }],
          },
          matches: {
            include: {
              homeTeam: { select: { id: true, name: true } },
              awayTeam: { select: { id: true, name: true } },
              winner: { select: { id: true, name: true } },
            },
            orderBy: { round: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
      matches: {
        where: { groupId: null },
        include: {
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
          winner: { select: { id: true, name: true } },
        },
        orderBy: { round: "asc" },
      },
      _count: { select: { teams: true, matches: true } },
    },
  });

  if (!tournament) notFound();

  const hasGroupFormat = tournament.format === TournamentFormat.GROUPS_AND_KNOCKOUT;
  const hasGroups = tournament.groups.length > 0;
  const hasBracket = tournament.matches.length > 0;
  const knockoutMatches = tournament.matches;

  const availableTabs: Tab[] = [
    "equipos",
    ...(hasGroupFormat ? ["grupos" as Tab] : []),
    "llave" as Tab,
  ];

  const rawTab = searchParams.tab as Tab | undefined;
  const activeTab: Tab = rawTab && availableTabs.includes(rawTab) ? rawTab : "equipos";

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/torneos"
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ← Torneos
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
          {tournament.description && (
            <p className="text-gray-500 text-sm mt-1">{tournament.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <TournamentStatusBadge status={tournament.status} />
            <span className="text-xs text-gray-400">
              {tournament._count.teams} equipos
            </span>
            {tournament.startDate && (
              <span className="text-xs text-gray-400">
                Inicio:{" "}
                {new Date(tournament.startDate).toLocaleDateString("es-AR")}
              </span>
            )}
          </div>
        </div>

        {isAdmin && (
          <TournamentActions
            tournamentId={tournament.id}
            status={tournament.status}
            format={tournament.format}
            teamCount={tournament._count.teams}
            hasGroups={hasGroups}
            hasBracket={hasBracket}
          />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {availableTabs.map((tab) => {
          const labels: Record<Tab, string> = {
            equipos: `Equipos (${tournament.teams.length})`,
            grupos: "Grupos",
            llave: "Llave",
          };
          const isActive = tab === activeTab;
          return (
            <Link
              key={tab}
              href={`/torneos/${params.id}?tab=${tab}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {labels[tab]}
            </Link>
          );
        })}
      </div>

      {/* Tab: Equipos */}
      {activeTab === "equipos" && (
        <section>
          {isAdmin && (
            <div className="flex justify-end mb-3">
              <Link
                href={`/torneos/${tournament.id}/equipos/nuevo`}
                className="text-sm text-red-600 hover:underline"
              >
                + Agregar equipo
              </Link>
            </div>
          )}

          {tournament.teams.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tournament.teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-3"
                >
                  <p className="font-medium text-gray-900 text-sm">{team.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {team.teamPlayers.map((tp) => tp.player.name).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No hay equipos inscriptos.{" "}
              {isAdmin && (
                <Link
                  href={`/torneos/${tournament.id}/equipos/nuevo`}
                  className="text-red-600 hover:underline"
                >
                  Agregar el primero
                </Link>
              )}
            </p>
          )}
        </section>
      )}

      {/* Tab: Grupos */}
      {activeTab === "grupos" && hasGroupFormat && (
        <section>
          <GroupStandingsTable groups={tournament.groups} isAdmin={isAdmin} />
        </section>
      )}

      {/* Tab: Llave */}
      {activeTab === "llave" && (
        <section>
          <Bracket matches={knockoutMatches} isAdmin={isAdmin} />
        </section>
      )}
    </div>
  );
}
