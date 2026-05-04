import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isOrganizer } from "@/lib/tournament-auth";
import { getRankingConfig, getRankingRows } from "@/lib/ranking";
import { prisma } from "@tdt/db";
import { MiRankingFilter } from "@/components/ui/MiRankingFilter";
import { Suspense } from "react";
import Link from "next/link";

type Props = { searchParams: Promise<{ torneo?: string; usuario?: string }> };

export default async function MiRankingPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isOrganizer(session.user.role)) redirect("/torneos");

  const { torneo, usuario } = await searchParams;

  const [config, tournaments] = await Promise.all([
    getRankingConfig(),
    prisma.tournament.findMany({
      where: { adminId: session.user.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let rows = await getRankingRows(config, session.user.id, torneo || undefined);

  if (usuario) {
    const q = usuario.toLowerCase();
    rows = rows.filter((r) => r.userName.toLowerCase().includes(q));
  }

  const subtitle = torneo
    ? tournaments.find((t) => t.id === torneo)?.name ?? "Torneo"
    : "todos tus torneos";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi ranking</h1>
        <p className="text-sm text-gray-500 mt-1">
          Jugadores de {subtitle}, ordenados por puntos acumulados.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tabla de jugadores</h2>
            <p className="text-sm text-gray-500 mt-1">
              {rows.length === 0
                ? "Sin resultados"
                : `${rows.length} jugador${rows.length !== 1 ? "es" : ""} en el ranking`}
            </p>
          </div>
          <Suspense>
            <MiRankingFilter tournaments={tournaments} />
          </Suspense>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1040px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Puesto</th>
                <th className="text-left px-5 py-3 font-medium">Jugador</th>
                <th className="text-right px-5 py-3 font-medium">Total</th>
                <th className="text-right px-5 py-3 font-medium">Torneos</th>
                <th className="text-right px-5 py-3 font-medium">Partidos</th>
                <th className="text-right px-5 py-3 font-medium">Grupos</th>
                <th className="text-right px-5 py-3 font-medium">Octavos</th>
                <th className="text-right px-5 py-3 font-medium">Cuartos</th>
                <th className="text-right px-5 py-3 font-medium">Semis</th>
                <th className="text-right px-5 py-3 font-medium">Finales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center text-sm text-gray-400">
                    {usuario
                      ? `No se encontraron jugadores con el nombre "${usuario}".`
                      : torneo
                      ? "Este torneo todavía no tiene partidos jugados."
                      : "Cuando tus torneos tengan partidos jugados, los jugadores apareceran aqui."}
                  </td>
                </tr>
              )}
              {rows.map((row, index) => (
                <tr key={row.userId} className="hover:bg-gray-50/50 align-top">
                  <td className="px-5 py-4 font-semibold text-gray-900">#{index + 1}</td>
                  <td className="px-5 py-4">
                    <Link href={`/usuarios/${row.userId}`} className="font-medium text-gray-900 hover:text-red-600 transition-colors">
                      {row.userName}
                    </Link>
                    <div className="text-xs text-gray-400 mt-1">{row.userEmail}</div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="font-semibold text-gray-900">{row.totalPoints}</div>
                    <div
                      className="text-xs text-gray-400 mt-1"
                      title={`Torneos: ${row.pointsBreakdown.tournamentsPlayed} · Partidos: ${row.pointsBreakdown.matchesPlayed} · Grupos: ${row.pointsBreakdown.groupWins} · Octavos: ${row.pointsBreakdown.roundOf16Wins} · Cuartos: ${row.pointsBreakdown.quarterfinalWins} · Semis: ${row.pointsBreakdown.semifinalWins} · Final: ${row.pointsBreakdown.finalWins}`}
                    >
                      {[
                        row.pointsBreakdown.tournamentsPlayed,
                        row.pointsBreakdown.matchesPlayed,
                        row.pointsBreakdown.groupWins,
                        row.pointsBreakdown.roundOf16Wins,
                        row.pointsBreakdown.quarterfinalWins,
                        row.pointsBreakdown.semifinalWins,
                        row.pointsBreakdown.finalWins,
                      ].join(" + ")}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-700">
                    <div>{row.tournamentsPlayed}</div>
                    <div className="text-xs text-gray-400 mt-1">{row.pointsBreakdown.tournamentsPlayed} pts</div>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-700">
                    <div>{row.matchesPlayed}</div>
                    <div className="text-xs text-gray-400 mt-1">{row.pointsBreakdown.matchesPlayed} pts</div>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-700">
                    <div>{row.winsByPhase.GROUP}</div>
                    <div className="text-xs text-gray-400 mt-1">{row.pointsBreakdown.groupWins} pts</div>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-700">
                    <div>{row.winsByPhase.ROUND_OF_16}</div>
                    <div className="text-xs text-gray-400 mt-1">{row.pointsBreakdown.roundOf16Wins} pts</div>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-700">
                    <div>{row.winsByPhase.QUARTERFINAL}</div>
                    <div className="text-xs text-gray-400 mt-1">{row.pointsBreakdown.quarterfinalWins} pts</div>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-700">
                    <div>{row.winsByPhase.SEMIFINAL}</div>
                    <div className="text-xs text-gray-400 mt-1">{row.pointsBreakdown.semifinalWins} pts</div>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-700">
                    <div>{row.winsByPhase.FINAL}</div>
                    <div className="text-xs text-gray-400 mt-1">{row.pointsBreakdown.finalWins} pts</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
