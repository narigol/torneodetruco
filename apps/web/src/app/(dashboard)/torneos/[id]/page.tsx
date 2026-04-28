import { notFound } from "next/navigation";
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

  const availableTabs: Tab[] = [
    "equipos",
    ...(hasGroupFormat ? ["grupos" as Tab] : []),
    "llave" as Tab,
  ];

  const rawTab = searchParams.tab as Tab | undefined;
  const activeTab: Tab = rawTab && availableTabs.includes(rawTab) ? rawTab : "equipos";

  const tabLabels: Record<Tab, string> = {
    equipos: `Equipos (${tournament.teams.length})`,
    grupos: "Grupos",
    llave: "Llave",
  };

  const formatLabel: Record<string, string> = {
    GROUPS_AND_KNOCKOUT: "Grupos + Eliminatoria",
    SINGLE_ELIMINATION: "Eliminación directa",
  };

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <Link href="/torneos" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-5 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Torneos
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <TournamentStatusBadge status={tournament.status} />
              <span className="text-xs text-gray-400">{formatLabel[tournament.format]}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{tournament.name}</h1>
            {tournament.description && (
              <p className="text-gray-500 text-sm mt-1.5">{tournament.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span>{tournament._count.teams} equipos</span>
              <span>{tournament._count.matches} partidos</span>
              {tournament.startDate && (
                <span>Inicio: {new Date(tournament.startDate).toLocaleDateString("es-AR")}</span>
              )}
              <span>Por {tournament.admin.name}</span>
            </div>
          </div>

          {isAdmin && (
            <div className="shrink-0">
              <TournamentActions
                tournamentId={tournament.id}
                status={tournament.status}
                format={tournament.format}
                teamCount={tournament._count.teams}
                hasGroups={hasGroups}
                hasBracket={hasBracket}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-100 rounded-xl p-1 w-fit">
        {availableTabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <Link
              key={tab}
              href={`/torneos/${params.id}?tab=${tab}`}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tabLabels[tab]}
            </Link>
          );
        })}
      </div>

      {/* Tab: Equipos */}
      {activeTab === "equipos" && (
        <section>
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <Link
                href={`/torneos/${tournament.id}/equipos/nuevo`}
                className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                + Agregar equipo
              </Link>
            </div>
          )}

          {tournament.teams.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tournament.teams.map((team) => (
                <div key={team.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 hover:border-gray-200 transition-colors">
                  <p className="font-semibold text-gray-900 text-sm">{team.name}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {team.teamPlayers.map((tp) => tp.player.name).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm">No hay equipos inscriptos.</p>
              {isAdmin && (
                <Link href={`/torneos/${tournament.id}/equipos/nuevo`} className="mt-2 inline-block text-red-600 hover:underline text-sm font-medium">
                  Agregar el primero →
                </Link>
              )}
            </div>
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
          <Bracket matches={tournament.matches} isAdmin={isAdmin} />
        </section>
      )}
    </div>
  );
}
