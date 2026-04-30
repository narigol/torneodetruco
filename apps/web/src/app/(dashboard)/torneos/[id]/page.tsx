import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, TournamentFormat } from "@tdt/db";
import Link from "next/link";
import { GroupStandingsTable } from "@/components/tournament/GroupStandingsTable";
import { MapaPreview } from "@/components/ui/MapaPreview";
import { Bracket } from "@/components/tournament/Bracket";
import { TournamentStatusBadge } from "@/components/tournament/TournamentStatusBadge";
import { TournamentActions } from "@/components/tournament/TournamentActions";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { FollowButton } from "@/components/ui/FollowButton";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const TABS = ["equipos", "grupos", "llave"] as const;
type Tab = (typeof TABS)[number];

export default async function TorneoDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab: rawTabParam } = await searchParams;
  const session = await getServerSession(authOptions);

  const tournament = await prisma.tournament.findUnique({
    where: { id },
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
            orderBy: [{ wins: "desc" }],
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
      interests: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              player: { select: { locality: true, provincia: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tournament) notFound();

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.id === tournament.adminId;

  const hasGroupFormat = tournament.format === TournamentFormat.GROUPS_AND_KNOCKOUT;
  const hasGroups = tournament.groups.length > 0;
  const hasBracket = tournament.matches.length > 0;

  const availableTabs: Tab[] = [
    "equipos",
    ...(hasGroupFormat ? ["grupos" as Tab] : []),
    "llave" as Tab,
  ];

  const rawTab = rawTabParam as Tab | undefined;
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

  const modalidadLabel: Record<number, string> = {
    1: "1 vs 1",
    2: "2 vs 2",
    3: "3 vs 3",
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
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                {modalidadLabel[tournament.playersPerTeam] ?? `${tournament.playersPerTeam} vs ${tournament.playersPerTeam}`}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{tournament.name}</h1>
            {tournament.description && (
              <p className="text-gray-500 text-sm mt-1.5">{tournament.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
              <span>{tournament._count.teams} equipos</span>
              <span>{tournament._count.matches} partidos</span>
              {hasGroupFormat && (
                <span>Clasifican {tournament.qualifyPerGroup} por grupo</span>
              )}
              {tournament.startDate && (
                <span>
                  {new Date(tournament.startDate).toLocaleDateString("es-AR")}
                  {tournament.startTime && ` · ${tournament.startTime}`}
                </span>
              )}
              {!tournament.startDate && tournament.startTime && (
                <span>{tournament.startTime}</span>
              )}
              <span>Por {tournament.admin.name}</span>
              {!isAdmin && (
                <FollowButton
                  organizerId={tournament.admin.id}
                  organizerName={tournament.admin.name}
                />
              )}
            </div>

            {tournament.location && (
              <div className="mt-2">
                <MapaPreview location={tournament.location} />
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="shrink-0 flex flex-col items-end gap-2">
              {tournament.status !== "FINISHED" && (
                <Link
                  href={`/torneos/${tournament.id}/editar`}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Editar torneo
                </Link>
              )}
              <TournamentActions
                tournamentId={tournament.id}
                status={tournament.status}
                format={tournament.format}
                teamCount={tournament._count.teams}
                hasGroups={hasGroups}
                hasBracket={hasBracket}
                published={tournament.published}
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
              href={`/torneos/${id}?tab=${tab}`}
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

          {/* Interesados — solo visible para el admin */}
          {isAdmin && tournament.interests.length > 0 && (
            <div className="mb-6 bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-purple-800 mb-3">
                {tournament.interests.length} jugador{tournament.interests.length !== 1 ? "es" : ""} interesado{tournament.interests.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {tournament.interests.map((i) => (
                  <div key={i.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-purple-100">
                    <div>
                      <span className="font-medium text-gray-900">{i.user.name}</span>
                      {(i.user.player?.locality || i.user.player?.provincia) && (
                        <span className="text-xs text-gray-400 ml-2">
                          {[i.user.player.locality, i.user.player.provincia].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                    {i.user.player?.phone && (
                      <a href={`tel:${i.user.player.phone}`} className="text-xs text-gray-400 hover:text-red-600">
                        {i.user.player.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
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
                  {isAdmin && ["DRAFT", "REGISTRATION"].includes(tournament.status) && (
                    <div className="mt-2 pt-2 border-t border-gray-50">
                      <DeleteButton
                        url={`/api/equipos/${team.id}`}
                        label="Eliminar"
                        confirmText="¿Eliminar equipo?"
                      />
                    </div>
                  )}
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
          <GroupStandingsTable
            groups={tournament.groups}
            isAdmin={isAdmin}
            qualifyPerGroup={tournament.qualifyPerGroup}
          />
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
