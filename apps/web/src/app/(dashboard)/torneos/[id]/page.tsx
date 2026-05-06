import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, TournamentFormat } from "@tdt/db";
import Link from "next/link";
import { GroupStandingsTable } from "@/components/tournament/GroupStandingsTable";
import { Bracket } from "@/components/tournament/Bracket";
import { TournamentStatusBadge } from "@/components/tournament/TournamentStatusBadge";
import { TournamentActions } from "@/components/tournament/TournamentActions";
import { TournamentOverview } from "@/components/tournament/TournamentOverview";
import { TournamentShareCard } from "@/components/tournament/TournamentShareCard";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { FollowButton } from "@/components/ui/FollowButton";
import { ReglamentoCollapsible } from "@/components/ui/ReglamentoCollapsible";
import { EmptyState } from "@/components/ui/EmptyState";
import { canGenerateGroups, canManageTournament } from "@/lib/tournament-auth";
import { resolveContact } from "@/lib/resolve-player";
import { PublicTournamentActions } from "@/components/tournament/PublicTournamentActions";
import { PendingTeamsPanel } from "@/components/tournament/PendingTeamsPanel";
import { EquipoDetailModal } from "@/components/ui/EquipoDetailModal";
import { ContactosTab } from "@/components/tournament/ContactosTab";
import { ConfirmadosTab } from "@/components/tournament/ConfirmadosTab";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const TABS = ["resumen", "equipos", "grupos", "llave", "confirmados", "contactos"] as const;
type Tab = (typeof TABS)[number];

export default async function TorneoDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab: rawTabParam } = await searchParams;
  const session = await getServerSession(authOptions);
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3001";
  const protocol = headersList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const publicTournamentUrl = `${protocol}://${host}/torneos/${id}`;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      admin: { select: { id: true, name: true, role: true, phone: true, acceptsWhatsAppContact: true } },
      reglamento: { select: { id: true, nombre: true, descripcion: true, contenido: true } },
      teams: {
        include: {
          teamPlayers: {
            include: { player: { select: { id: true, name: true, email: true, dni: true, phone: true, locality: true, provincia: true, userId: true, user: { select: { email: true, phone: true, locality: true, provincia: true } } } } },
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
            orderBy: [{ scheduledAt: "asc" }, { round: "asc" }],
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
        orderBy: [{ scheduledAt: "asc" }, { round: "asc" }],
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

  const canManage = canManageTournament(session, tournament.adminId);

  const myUserData = !canManage && session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, dni: true, phone: true, player: { select: { id: true } } },
      })
    : null;

  const myPlayerId = myUserData?.player?.id ?? null;

  const pendingTeams = tournament.teams.filter((t) => t.registrationStatus === "PENDING");
  const approvedTeams = tournament.teams.filter((t) => t.registrationStatus === "APPROVED");

  const alreadyInscripto = myPlayerId
    ? tournament.teams.some((t) => t.teamPlayers.some((tp) => tp.player.id === myPlayerId))
    : false;
  const myTeamIsPending = myPlayerId
    ? pendingTeams.some((t) => t.teamPlayers.some((tp) => tp.player.id === myPlayerId))
    : false;
  const canGenerateGroupsPermission = canManage && canGenerateGroups(session);

  // Fetch organizer contacts for Contactos tab (same sources as /contactos page)
  const [orgOtherTournaments, orgFollowers, orgManualContacts] = canManage
    ? await Promise.all([
        prisma.tournament.findMany({
          where: { adminId: tournament.adminId, id: { not: id } },
          select: {
            teams: {
              where: { registrationStatus: "APPROVED" },
              select: {
                teamPlayers: {
                  select: {
                    player: {
                      select: {
                        id: true, name: true, email: true, phone: true,
                        locality: true, provincia: true, userId: true,
                        user: { select: { email: true, phone: true, locality: true, provincia: true, dni: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.follow.findMany({
          where: { followingId: tournament.adminId },
          select: { follower: { select: { id: true, name: true, phone: true, email: true, locality: true, provincia: true } } },
        }),
        prisma.organizerContact.findMany({
          where: { organizerId: tournament.adminId },
          select: { id: true, name: true, phone: true, email: true, locality: true, provincia: true },
          orderBy: { createdAt: "asc" },
        }),
      ])
    : [[], [], []];

  // Build deduplicated contact map (same logic as /contactos page)
  const registeredUserIds = new Set(
    approvedTeams.flatMap((t) => t.teamPlayers.map((tp) => tp.player.userId)).filter(Boolean)
  );
  const registeredPlayerIds = new Set(
    approvedTeams.flatMap((t) => t.teamPlayers.map((tp) => tp.player.id))
  );

  type TournamentContact = { id: string; name: string; phone: string | null; email: string | null; locality: string | null; provincia: string | null; isRegistered: boolean };
  const contactMap = new Map<string, TournamentContact>();

  // Players from other organizer tournaments
  for (const t of orgOtherTournaments) {
    for (const team of t.teams) {
      for (const tp of team.teamPlayers) {
        const r = resolveContact(tp.player);
        if (!contactMap.has(r.id)) {
          contactMap.set(r.id, {
            id: r.id,
            name: r.name,
            phone: r.phone,
            email: r.email,
            locality: r.locality,
            provincia: r.provincia,
            isRegistered: registeredPlayerIds.has(r.id) || (!!r.userId && registeredUserIds.has(r.userId)),
          });
        }
      }
    }
  }

  // Followers (skip if already in map by userId)
  const linkedUserIds = new Set([...contactMap.values()].map((c) => c.id));
  for (const { follower } of orgFollowers) {
    if (linkedUserIds.has(follower.id)) continue;
    contactMap.set(`u:${follower.id}`, {
      id: `u:${follower.id}`,
      name: follower.name,
      phone: follower.phone,
      email: follower.email,
      locality: follower.locality,
      provincia: follower.provincia,
      isRegistered: registeredUserIds.has(follower.id),
    });
  }

  // Manual contacts
  for (const mc of orgManualContacts) {
    contactMap.set(`mc:${mc.id}`, {
      id: `mc:${mc.id}`,
      name: mc.name,
      phone: mc.phone,
      email: mc.email,
      locality: mc.locality,
      provincia: mc.provincia,
      isRegistered: false,
    });
  }

  const tournamentContacts = [...contactMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  );

  const hasGroupFormat = tournament.format === TournamentFormat.GROUPS_AND_KNOCKOUT;
  const hasGroups = tournament.groups.length > 0;
  const hasBracket = tournament.matches.length > 0;
  const hasPlayedGroupMatches = hasGroupFormat && tournament.groups.some((g) =>
    g.matches.some((m) => m.status === "FINISHED")
  );

  // groupsSorted: each group's standings in wins-desc order (already ordered by DB query)
  const groupsSorted = hasGroupFormat
    ? tournament.groups.map((g) => ({
        teams: g.standings.map((s) => ({ id: s.team.id, name: s.team.name })),
      }))
    : [];

  const bracketTeams: { id: string; name: string }[] = hasGroupFormat
    ? groupsSorted.flatMap((g) => g.teams.slice(0, tournament.qualifyPerGroup))
    : approvedTeams.map((t) => ({ id: t.id, name: t.name }));

  const availableTabs: Tab[] = [
    ...(canManage ? ["resumen" as Tab] : []),
    "equipos",
    ...(canManage ? ["confirmados" as Tab] : []),
    ...(hasGroupFormat ? ["grupos" as Tab] : []),
    "llave" as Tab,
    ...(canManage && tournament.status === "REGISTRATION" ? ["contactos" as Tab] : []),
  ];

  const rawTab = rawTabParam as Tab | undefined;
  const activeTab: Tab = rawTab && availableTabs.includes(rawTab)
    ? rawTab
    : (canManage ? "resumen" : "equipos");

  const hasFee = tournament.inscriptionFee != null && tournament.inscriptionFee > 0;
  const isOwner = session?.user?.id === tournament.adminId;
  const unpaidCount = hasFee && isOwner ? approvedTeams.filter((t) => !t.hasPaid).length : 0;

  const tabLabels: Record<Tab, string> = {
    resumen: "Resumen",
    equipos: `Equipos (${approvedTeams.length}${pendingTeams.length > 0 ? ` · ${pendingTeams.length} pend.` : ""}${unpaidCount > 0 ? ` · ${unpaidCount} sin pagar` : ""})`,
    grupos: "Grupos",
    llave: "Llave",
    confirmados: `Confirmados (${approvedTeams.length})`,
    contactos: "Contactos",
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
              <span>{approvedTeams.length} equipos{pendingTeams.length > 0 ? ` · ${pendingTeams.length} pendiente${pendingTeams.length !== 1 ? "s" : ""}` : ""}</span>
              {tournament.maxPlayers && (
                <span>Cupo: {tournament.maxPlayers} jugadores</span>
              )}
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
              {!canManage && tournament.admin.phone && tournament.admin.acceptsWhatsAppContact && (
                <a
                  href={`https://wa.me/${tournament.admin.phone.replace(/\D/g, "").replace(/^0/, "").replace(/^(?!54)/, "549")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
              {!canManage && tournament.admin.role !== "ADMIN" && (
                <FollowButton
                  organizerId={tournament.admin.id}
                  organizerName={tournament.admin.name}
                />
              )}
            </div>

            {tournament.location && (() => {
              const loc = tournament.location!;
              const short = loc.startsWith("http") ? "Ver ubicación" : loc.split(",").slice(0, 2).join(",").trim();
              const mapsUrl = loc.startsWith("http")
                ? loc
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
              return (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-gray-500 hover:text-red-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate max-w-xs">{short}</span>
                </a>
              );
            })()}
          </div>

          {tournament.reglamento && (
            <ReglamentoCollapsible reglamento={tournament.reglamento} />
          )}

          {canManage && (
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
                teamCount={approvedTeams.length}
                hasGroups={hasGroups}
                hasBracket={hasBracket}
                hasPlayedGroupMatches={hasPlayedGroupMatches}
                canGenerateGroups={canGenerateGroupsPermission}
                bracketTeams={bracketTeams}
                groupsSorted={groupsSorted}
                initialQualifyPerGroup={tournament.qualifyPerGroup}
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

      {/* Tab: Resumen */}
      {activeTab === "resumen" && canManage && (
        <div className="space-y-6">
          <TournamentOverview tournament={tournament} />
          <TournamentShareCard publicUrl={publicTournamentUrl} />
        </div>
      )}

      {/* Tab: Equipos */}
      {activeTab === "equipos" && (
        <section>
          {canManage && (
            <div className="flex items-center justify-end gap-3 mb-4">
              <Link
                href={`/torneos/${tournament.id}/equipos/nuevo`}
                className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                + Agregar equipo
              </Link>
            </div>
          )}

          {/* Formulario de inscripción para jugadores no-admin */}
          {!canManage && tournament.status === "REGISTRATION" && session?.user?.id && (
            <div className="mb-6">
              <PublicTournamentActions
                tournamentId={tournament.id}
                playersPerTeam={tournament.playersPerTeam}
                loggedIn={true}
                callbackUrl={`/torneos/${tournament.id}`}
                initialInscripto={alreadyInscripto && !myTeamIsPending}
                initialPending={myTeamIsPending}
                userData={myUserData ? {
                  name: myUserData.name ?? "",
                  email: myUserData.email ?? "",
                  dni: myUserData.dni ?? "",
                  phone: myUserData.phone ?? "",
                } : undefined}
              />
            </div>
          )}

          {/* Solicitudes pendientes — solo visible para el organizador */}
          {canManage && (
            <PendingTeamsPanel
              teams={pendingTeams.map((t) => ({
                id: t.id,
                name: t.name,
                players: t.teamPlayers.map((tp) => ({ name: tp.player.name })),
              }))}
            />
          )}

          {/* Interesados — solo visible para el admin */}
          {canManage && tournament.interests.length > 0 && (
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

          {approvedTeams.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {approvedTeams.map((team) => (
                canManage ? (
                  <EquipoDetailModal
                    key={team.id}
                    teamName={team.name}
                    players={team.teamPlayers.map((tp) => tp.player)}
                    canDelete={["DRAFT", "REGISTRATION"].includes(tournament.status)}
                    teamId={team.id}
                    inscriptionFee={tournament.inscriptionFee}
                    hasPaid={team.hasPaid}
                  />
                ) : (
                  <div key={team.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3.5">
                    <p className="font-semibold text-gray-900 text-sm">{team.name}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {team.teamPlayers.map((tp) => tp.player.name).join(" · ")}
                    </p>
                  </div>
                )
              ))}
            </div>
          ) : (
            <EmptyState
              message="No hay equipos inscriptos."
              submessage={canManage ? "Usá el botón de arriba para agregar equipos." : undefined}
            />
          )}
        </section>
      )}

      {/* Tab: Grupos */}
      {activeTab === "grupos" && hasGroupFormat && (
        <section>
          <GroupStandingsTable
            groups={tournament.groups}
            isAdmin={canManage}
            qualifyPerGroup={tournament.qualifyPerGroup}
            hasBracket={hasBracket}
          />
        </section>
      )}

      {/* Tab: Llave */}
      {activeTab === "llave" && (
        <section>
          <Bracket matches={tournament.matches} isAdmin={canManage} />
        </section>
      )}

      {/* Tab: Confirmados */}
      {activeTab === "confirmados" && canManage && (
        <section>
          <ConfirmadosTab
            hasFee={hasFee}
            teams={approvedTeams.map((t) => ({
              id: t.id,
              name: t.name,
              hasPaid: t.hasPaid,
              players: t.teamPlayers.map((tp) => {
                const r = resolveContact(tp.player);
                return { id: r.id, name: r.name, phone: r.phone, email: r.email };
              }),
            }))}
          />
        </section>
      )}

      {/* Tab: Contactos */}
      {activeTab === "contactos" && canManage && (
        <section>
          <ContactosTab
            contacts={tournamentContacts}
            tournament={{
              name: tournament.name,
              startDate: tournament.startDate?.toISOString() ?? null,
              startTime: tournament.startTime,
              location: tournament.location,
              locality: tournament.locality,
              provincia: tournament.provincia,
              playersPerTeam: tournament.playersPerTeam,
              inscriptionFee: tournament.inscriptionFee,
              publicUrl: publicTournamentUrl,
            }}
          />
        </section>
      )}
    </div>
  );
}
