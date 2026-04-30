import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRankingConfig, getRankingRows } from "@/lib/ranking";
import { RankingConfigForm } from "@/components/ui/RankingConfigForm";

export default async function RankingPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const config = await getRankingConfig();
  const rows = await getRankingRows(config);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ranking general</h1>
        <p className="text-sm text-gray-500 mt-1">
          Puntaje acumulado por torneos jugados, partidos jugados y victorias por etapa.
        </p>
      </div>

      {isAdmin && (
        <RankingConfigForm
          initial={{
            tournamentPlayedPoints: config.tournamentPlayedPoints,
            matchPlayedPoints: config.matchPlayedPoints,
            groupWinPoints: config.groupWinPoints,
            roundOf16WinPoints: config.roundOf16WinPoints,
            quarterfinalWinPoints: config.quarterfinalWinPoints,
            semifinalWinPoints: config.semifinalWinPoints,
            finalWinPoints: config.finalWinPoints,
          }}
        />
      )}

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Tabla general</h2>
          <p className="text-sm text-gray-500 mt-1">
            {rows.length} usuario{rows.length !== 1 ? "s" : ""} en el ranking
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1040px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Puesto</th>
                <th className="text-left px-5 py-3 font-medium">Usuario</th>
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
                  <td colSpan={10} className="px-5 py-12 text-center text-sm text-gray-400">
                    Todavía no hay datos de ranking. Jugá torneos para aparecer acá.
                  </td>
                </tr>
              )}
              {rows.map((row, index) => (
                <tr key={row.userId} className="hover:bg-gray-50/50 align-top">
                  <td className="px-5 py-4 font-semibold text-gray-900">#{index + 1}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{row.userName}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {row.userEmail} · {row.role === "ADMIN" ? "Organizador" : "Jugador"}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="font-semibold text-gray-900">{row.totalPoints}</div>
                    <div className="text-xs text-gray-400 mt-1" title={`Torneos: ${row.pointsBreakdown.tournamentsPlayed} · Partidos: ${row.pointsBreakdown.matchesPlayed} · Grupos: ${row.pointsBreakdown.groupWins} · Octavos: ${row.pointsBreakdown.roundOf16Wins} · Cuartos: ${row.pointsBreakdown.quarterfinalWins} · Semis: ${row.pointsBreakdown.semifinalWins} · Final: ${row.pointsBreakdown.finalWins}`}>
                      {[row.pointsBreakdown.tournamentsPlayed, row.pointsBreakdown.matchesPlayed, row.pointsBreakdown.groupWins, row.pointsBreakdown.roundOf16Wins, row.pointsBreakdown.quarterfinalWins, row.pointsBreakdown.semifinalWins, row.pointsBreakdown.finalWins].join(" + ")}
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
