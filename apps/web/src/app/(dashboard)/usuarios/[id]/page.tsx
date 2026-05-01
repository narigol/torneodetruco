import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@tdt/db";
import Link from "next/link";
import { isOrganizer } from "@/lib/tournament-auth";
import { getRankingConfig } from "@/lib/ranking";

type Props = { params: Promise<{ id: string }> };

const PHASE_LABEL: Record<string, string> = {
  GROUP: "Fase de grupos",
  ROUND_OF_16: "Octavos",
  QUARTERFINAL: "Cuartos",
  SEMIFINAL: "Semifinal",
  FINAL: "Final",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En juego",
  FINISHED: "Finalizado",
};

export default async function UsuarioDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || !isOrganizer(session.user.role)) redirect("/torneos");
  const rankingConfig = await getRankingConfig();

  const usuario = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      dni: true,
      phone: true,
      locality: true,
      province: true,
      role: true,
      plan: true,
      pendingActivation: true,
      createdAt: true,
      player: {
        select: {
          id: true,
          confirmed: true,
          teamPlayers: {
            select: {
              team: {
                select: {
                  id: true,
                  name: true,
                  tournament: {
                    select: { id: true, name: true, status: true, format: true, startDate: true },
                  },
                  homeMatches: {
                    select: {
                      id: true,
                      phase: true,
                      status: true,
                      homeScore: true,
                      awayScore: true,
                      homeTeam: { select: { name: true } },
                      awayTeam: { select: { name: true } },
                      winner: { select: { name: true } },
                    },
                    orderBy: { createdAt: "asc" },
                  },
                  awayMatches: {
                    select: {
                      id: true,
                      phase: true,
                      status: true,
                      homeScore: true,
                      awayScore: true,
                      homeTeam: { select: { name: true } },
                      awayTeam: { select: { name: true } },
                      winner: { select: { name: true } },
                    },
                    orderBy: { createdAt: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!usuario) notFound();

  const teamPlayers = usuario.player?.teamPlayers ?? [];

  // Agrupar partidos por torneo
  const torneoMap = new Map<string, {
    torneo: typeof teamPlayers[0]["team"]["tournament"];
    teamName: string;
    partidos: Array<{
      id: string;
      phase: string;
      status: string;
      homeScore: number | null;
      awayScore: number | null;
      homeTeam: { name: string };
      awayTeam: { name: string } | null;
      winner: { name: string } | null;
    }>;
  }>();

  for (const tp of teamPlayers) {
    const { team } = tp;
    const partidos = [...team.homeMatches, ...team.awayMatches].sort(
      (a, b) => Object.keys(PHASE_LABEL).indexOf(a.phase) - Object.keys(PHASE_LABEL).indexOf(b.phase)
    );
    torneoMap.set(team.tournament.id, {
      torneo: team.tournament,
      teamName: team.name,
      partidos,
    });
  }

  const torneos = [...torneoMap.values()];
  const allMatches = torneos.flatMap((entry) => entry.partidos);
  const finishedMatches = allMatches.filter((match) => match.status === "FINISHED" && match.awayTeam);
  const wins = finishedMatches.filter((match) => match.winner?.name === torneoDePartido(match, torneos)).length;
  const losses = finishedMatches.length - wins;
  const tournamentsPlayed = torneos.length;
  const totalPoints = torneos.reduce((sum, { partidos }) => {
    const matchPoints = partidos.filter((match) => match.status === "FINISHED").length * rankingConfig.matchPlayedPoints;
    const phasePoints = partidos.reduce((acc, match) => {
      const teamName = torneos.find((t) => t.partidos.some((p) => p.id === match.id))?.teamName;
      if (match.winner?.name !== teamName) return acc;
      if (match.phase === "GROUP") return acc + rankingConfig.groupWinPoints;
      if (match.phase === "ROUND_OF_16") return acc + rankingConfig.roundOf16WinPoints;
      if (match.phase === "QUARTERFINAL") return acc + rankingConfig.quarterfinalWinPoints;
      if (match.phase === "SEMIFINAL") return acc + rankingConfig.semifinalWinPoints;
      return acc + rankingConfig.finalWinPoints;
    }, 0);
    return sum + rankingConfig.tournamentPlayedPoints + matchPoints + phasePoints;
  }, 0);
  const phaseLabels = torneos.flatMap(({ partidos, teamName }) =>
    partidos
      .filter((match) => match.winner?.name === teamName)
      .map((match) => PHASE_LABEL[match.phase] ?? match.phase)
  );
  const bestPhase = phaseLabels.at(-1) ?? "Sin victorias";
  const progression = buildProgression(torneos, rankingConfig);
  const rivalryRows = buildRivalries(torneos);
  const winRate = finishedMatches.length > 0 ? Math.round((wins / finishedMatches.length) * 100) : 0;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/usuarios" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Usuarios
        </Link>
      </div>

      {/* Perfil */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{usuario.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{usuario.email}</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {usuario.pendingActivation ? (
              <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-100 px-2 py-0.5 rounded-full font-medium">Pendiente</span>
            ) : (
              <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full font-medium">Activo</span>
            )}
            {usuario.role === "ADMIN" && (
              <span className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full font-medium">Super Admin</span>
            )}
            {usuario.role === "ORGANIZER" && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">Organizador</span>
            )}
            {usuario.plan === "PRO" && (
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-medium">PRO</span>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {usuario.dni && (
            <>
              <dt className="text-gray-400">DNI</dt>
              <dd className="text-gray-700 font-medium">{usuario.dni}</dd>
            </>
          )}
          {usuario.phone && (
            <>
              <dt className="text-gray-400">Teléfono</dt>
              <dd className="text-gray-700">{usuario.phone}</dd>
            </>
          )}
          {(usuario.locality || usuario.province) && (
            <>
              <dt className="text-gray-400">Localidad</dt>
              <dd className="text-gray-700">{[usuario.locality, usuario.province].filter(Boolean).join(", ")}</dd>
            </>
          )}
          <dt className="text-gray-400">Miembro desde</dt>
          <dd className="text-gray-700">{new Date(usuario.createdAt).toLocaleDateString("es-AR", { year: "numeric", month: "long" })}</dd>
        </dl>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard label="Torneos" value={String(tournamentsPlayed)} detail="Participaciones registradas" />
        <StatCard label="Partidos" value={String(finishedMatches.length)} detail={`${wins} ganados y ${losses} perdidos`} />
        <StatCard label="Win rate" value={`${winRate}%`} detail={finishedMatches.length > 0 ? "Sobre partidos finalizados" : "Todavia sin resultados"} />
        <StatCard label="Puntos" value={String(totalPoints)} detail={`Mejor fase: ${bestPhase}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">Progresion de puntos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Evolucion acumulada torneo a torneo.
          </p>
          <div className="mt-5">
            <ProgressChart points={progression} />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900">Rivales frecuentes</h2>
          <p className="text-sm text-gray-500 mt-1">
            Historial resumido contra otros equipos.
          </p>
          <div className="mt-4 space-y-3">
            {rivalryRows.length === 0 ? (
              <p className="text-sm text-gray-400">Todavia no hay enfrentamientos suficientes para mostrar.</p>
            ) : (
              rivalryRows.map((row) => (
                <div key={row.opponent} className="rounded-xl border border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{row.opponent}</p>
                      <p className="text-xs text-gray-400 mt-1">{row.matches} partido{row.matches !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {row.wins}-{row.losses}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Torneos y partidos */}
      {torneos.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm bg-white border border-gray-100 rounded-2xl">
          No participó en ningún torneo todavía
        </div>
      ) : (
        <div className="space-y-6">
          {torneos.map(({ torneo, teamName, partidos }) => (
            <div key={torneo.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <Link href={`/torneos/${torneo.id}`} className="font-semibold text-gray-900 hover:text-red-600 transition-colors">
                    {torneo.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">Equipo: {teamName}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                  torneo.status === "FINISHED" ? "bg-gray-50 text-gray-500 border-gray-100" :
                  torneo.status === "IN_PROGRESS" ? "bg-green-50 text-green-700 border-green-100" :
                  "bg-yellow-50 text-yellow-700 border-yellow-100"
                }`}>
                  {torneo.status === "FINISHED" ? "Finalizado" : torneo.status === "IN_PROGRESS" ? "En curso" : "Inscripción"}
                </span>
              </div>

              {partidos.length === 0 ? (
                <p className="px-6 py-4 text-sm text-gray-400">Sin partidos registrados</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 text-xs uppercase border-b border-gray-100">
                      <th className="text-left px-6 py-2.5 font-medium">Fase</th>
                      <th className="text-left px-6 py-2.5 font-medium">Partido</th>
                      <th className="text-center px-6 py-2.5 font-medium">Resultado</th>
                      <th className="text-left px-6 py-2.5 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {partidos.map((p) => {
                      const esLocal = p.homeTeam.name === teamName;
                      const gano = p.winner?.name === teamName;
                      const perdio = p.status === "FINISHED" && p.winner && !gano;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{PHASE_LABEL[p.phase] ?? p.phase}</td>
                          <td className="px-6 py-3 text-gray-700">
                            {p.homeTeam.name} vs {p.awayTeam?.name ?? "—"}
                          </td>
                          <td className="px-6 py-3 text-center font-mono text-gray-700">
                            {p.status === "FINISHED" && p.homeScore != null
                              ? `${p.homeScore} - ${p.awayScore}`
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-6 py-3">
                            {p.status === "FINISHED" ? (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                                gano ? "bg-green-50 text-green-700 border-green-100" :
                                perdio ? "bg-red-50 text-red-600 border-red-100" :
                                "bg-gray-50 text-gray-500 border-gray-100"
                              }`}>
                                {gano ? "Ganó" : perdio ? "Perdió" : "Empate"}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">{STATUS_LABEL[p.status]}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-sm text-gray-500 mt-2">{detail}</p>
    </div>
  );
}

function ProgressChart({
  points,
}: {
  points: Array<{ label: string; total: number; tournamentPoints: number }>;
}) {
  if (points.length === 0) {
    return <p className="text-sm text-gray-400">Aun no hay torneos suficientes para graficar.</p>;
  }

  const max = Math.max(...points.map((point) => point.total), 1);
  const path = points.map((point, index) => {
    const x = points.length === 1 ? 240 : (index / (points.length - 1)) * 240;
    const y = 120 - (point.total / max) * 100;
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");

  return (
    <div>
      <svg viewBox="0 0 240 130" className="w-full h-36">
        <path d="M0 120 H240" stroke="#e5e7eb" strokeWidth="1" />
        <path d={path} fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
        {points.map((point, index) => {
          const x = points.length === 1 ? 240 : (index / (points.length - 1)) * 240;
          const y = 120 - (point.total / max) * 100;
          return <circle key={point.label} cx={x} cy={y} r="4" fill="#dc2626" />;
        })}
      </svg>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {points.map((point) => (
          <div key={point.label} className="rounded-xl bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-400 truncate">{point.label}</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{point.total} pts</p>
            <p className="text-xs text-gray-500">+{point.tournamentPoints} en ese torneo</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildProgression(
  torneos: Array<{
    torneo: { name: string };
    teamName: string;
    partidos: Array<{
      phase: string;
      status: string;
      winner: { name: string } | null;
    }>;
  }>,
  config: {
    tournamentPlayedPoints: number;
    matchPlayedPoints: number;
    groupWinPoints: number;
    roundOf16WinPoints: number;
    quarterfinalWinPoints: number;
    semifinalWinPoints: number;
    finalWinPoints: number;
  }
) {
  let accumulated = 0;

  return torneos.map(({ torneo, teamName, partidos }) => {
    const matchPoints = partidos.filter((match) => match.status === "FINISHED").length * config.matchPlayedPoints;
    const winPoints = partidos.reduce((sum, match) => {
      if (match.winner?.name !== teamName) return sum;
      switch (match.phase) {
        case "GROUP":
          return sum + config.groupWinPoints;
        case "ROUND_OF_16":
          return sum + config.roundOf16WinPoints;
        case "QUARTERFINAL":
          return sum + config.quarterfinalWinPoints;
        case "SEMIFINAL":
          return sum + config.semifinalWinPoints;
        case "FINAL":
          return sum + config.finalWinPoints;
        default:
          return sum;
      }
    }, 0);

    const tournamentPoints = config.tournamentPlayedPoints + matchPoints + winPoints;
    accumulated += tournamentPoints;

    return {
      label: torneo.name,
      total: accumulated,
      tournamentPoints,
    };
  });
}

function buildRivalries(
  torneos: Array<{
    teamName: string;
    partidos: Array<{
      status: string;
      homeTeam: { name: string };
      awayTeam: { name: string } | null;
      winner: { name: string } | null;
    }>;
  }>
) {
  const map = new Map<string, { opponent: string; matches: number; wins: number; losses: number }>();

  for (const { teamName, partidos } of torneos) {
    for (const match of partidos) {
      if (match.status !== "FINISHED" || !match.awayTeam) continue;
      const opponent = match.homeTeam.name === teamName ? match.awayTeam.name : match.homeTeam.name;
      const current = map.get(opponent) ?? { opponent, matches: 0, wins: 0, losses: 0 };
      current.matches += 1;
      if (match.winner?.name === teamName) current.wins += 1;
      else current.losses += 1;
      map.set(opponent, current);
    }
  }

  return [...map.values()].sort((a, b) => {
    if (b.matches !== a.matches) return b.matches - a.matches;
    return a.opponent.localeCompare(b.opponent, "es", { sensitivity: "base" });
  }).slice(0, 6);
}

function torneoDePartido(
  partido: {
    id: string;
  },
  torneos: Array<{
    teamName: string;
    partidos: Array<{ id: string }>;
  }>
) {
  return torneos.find((torneo) => torneo.partidos.some((p) => p.id === partido.id))?.teamName;
}
