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

type Props = {
  groups: Group[];
  isAdmin?: boolean;
};

export function GroupStandingsTable({ groups, isAdmin }: Props) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.id}>
          <h3 className="text-base font-semibold text-gray-700 mb-3">
            {group.name}
          </h3>

          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th className="text-left px-4 py-2 font-medium">Equipo</th>
                  <th className="px-3 py-2 font-medium text-center">PJ</th>
                  <th className="px-3 py-2 font-medium text-center">G</th>
                  <th className="px-3 py-2 font-medium text-center">E</th>
                  <th className="px-3 py-2 font-medium text-center">P</th>
                  <th className="px-3 py-2 font-medium text-center">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {group.standings.map((s, i) => (
                  <tr
                    key={s.team.id}
                    className={i < 2 ? "bg-green-50/40" : ""}
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      <span className="text-gray-400 mr-2">{i + 1}.</span>
                      {s.team.name}
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-600">
                      {s.wins + s.losses + s.draws}
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-600">
                      {s.wins}
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-600">
                      {s.draws}
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-600">
                      {s.losses}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-gray-900">
                      {s.points}
                    </td>
                  </tr>
                ))}
                {group.standings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-gray-400 text-sm">
                      Sin posiciones todavía
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {group.matches.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 uppercase font-medium mb-2">
                Partidos
              </p>
              {group.matches.map((m) => (
                <MatchRow key={m.id} match={m} isAdmin={isAdmin} />
              ))}
            </div>
          )}
        </div>
      ))}

      {groups.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-8">
          Los grupos se generan al iniciar el torneo
        </p>
      )}
    </div>
  );
}

function MatchRow({ match, isAdmin }: { match: Match; isAdmin?: boolean }) {
  const finished = match.status === "FINISHED";

  return (
    <div className="bg-white border border-gray-100 rounded-lg px-4 py-2.5 flex items-center gap-3 text-sm">
      <span className="flex-1 text-right font-medium text-gray-800">
        {match.homeTeam.name}
      </span>
      <span className="text-gray-400 font-mono text-xs w-16 text-center">
        {finished
          ? `${match.homeScore} - ${match.awayScore}`
          : "vs"}
      </span>
      <span className="flex-1 font-medium text-gray-800">
        {match.awayTeam.name}
      </span>
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
