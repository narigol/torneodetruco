import { ResultadoModal } from "@/components/ui/ResultadoModal";

type Standing = {
  team: { id: string; name: string };
  points: number;
  wins: number;
  losses: number;
  draws: number;
  scored: number;
  against: number;
};

type Match = {
  id: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

type Group = {
  id: string;
  name: string;
  standings: Standing[];
  matches: Match[];
};

type Props = { groups: Group[]; isAdmin?: boolean };

export function GroupStandingsTable({ groups, isAdmin }: Props) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-gray-400 text-sm">Los grupos se generan al iniciar el torneo</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.id}>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">{group.name}</h3>

          {/* Tabla de standings */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Equipo</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">PJ</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">G</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">E</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">P</th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Pts</th>
                </tr>
              </thead>
              <tbody>
                {group.standings.map((s, i) => {
                  const pj = s.wins + s.losses + s.draws;
                  const qualifies = i < 2;
                  return (
                    <tr key={s.team.id} className={`border-b border-gray-50 last:border-0 ${qualifies ? "bg-green-50/30" : ""}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${qualifies ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                            {i + 1}
                          </span>
                          <span className="font-medium text-gray-900">{s.team.name}</span>
                          {qualifies && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Clasifica</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-500 tabular-nums">{pj}</td>
                      <td className="px-3 py-3 text-center text-gray-500 tabular-nums">{s.wins}</td>
                      <td className="px-3 py-3 text-center text-gray-500 tabular-nums">{s.draws}</td>
                      <td className="px-3 py-3 text-center text-gray-500 tabular-nums">{s.losses}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-bold text-gray-900 tabular-nums">{s.points}</span>
                      </td>
                    </tr>
                  );
                })}
                {group.standings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-gray-400 text-sm">
                      Sin posiciones todavía
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Partidos del grupo */}
          {group.matches.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Partidos</p>
              {group.matches.map((m) => (
                <MatchRow key={m.id} match={m} isAdmin={isAdmin} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MatchRow({ match, isAdmin }: { match: Match; isAdmin?: boolean }) {
  const finished = match.status === "FINISHED";

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-5 py-3 flex items-center gap-4 text-sm hover:border-gray-200 transition-colors">
      <span className="flex-1 text-right font-medium text-gray-800 truncate">{match.homeTeam.name}</span>
      <span className={`text-center font-mono text-xs px-3 py-1 rounded-lg tabular-nums min-w-[52px] ${finished ? "bg-gray-900 text-white font-bold" : "bg-gray-100 text-gray-500"}`}>
        {finished ? `${match.homeScore} – ${match.awayScore}` : "vs"}
      </span>
      <span className="flex-1 font-medium text-gray-800 truncate">{match.awayTeam.name}</span>
      {isAdmin && !finished && (
        <ResultadoModal
          matchId={match.id}
          homeTeam={match.homeTeam.name}
          awayTeam={match.awayTeam.name}
        />
      )}
    </div>
  );
}
