import { ResultadoModal } from "@/components/ui/ResultadoModal";
import { ScheduleMatchModal } from "@/components/ui/ScheduleMatchModal";
import { MatchAuditModal } from "@/components/ui/MatchAuditModal";

type Standing = {
  team: { id: string; name: string };
  wins: number;
  losses: number;
  scored: number;
  against: number;
};

type MatchWithWinner = {
  id: string;
  status: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string } | null;
  homeScore: number | null;
  awayScore: number | null;
  winner?: { id: string; name: string } | null;
  scheduledAt?: string | Date | null;
  location?: string | null;
};

type Group = {
  id: string;
  name: string;
  standings: Standing[];
  matches: MatchWithWinner[];
};

type Props = {
  groups: Group[];
  isAdmin?: boolean;
  qualifyPerGroup?: number;
};

function sortStandings(standings: Standing[], matches: MatchWithWinner[]): { standing: Standing; h2h: boolean }[] {
  const sorted = [...standings].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const dfA = a.scored - a.against;
    const dfB = b.scored - b.against;
    if (dfB !== dfA) return dfB - dfA;

    const h2h = matches.find(
      (m) =>
        m.status === "FINISHED" &&
        m.winner &&
        ((m.homeTeam.id === a.team.id && m.awayTeam?.id === b.team.id) ||
          (m.homeTeam.id === b.team.id && m.awayTeam?.id === a.team.id))
    );

    if (h2h?.winner) {
      if (h2h.winner.id === a.team.id) return -1;
      if (h2h.winner.id === b.team.id) return 1;
    }

    return 0;
  });

  const h2hTeams = new Set<string>();
  for (let i = 0; i + 1 < sorted.length; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a.wins === b.wins && a.scored - a.against === b.scored - b.against) {
      const h2h = matches.find(
        (m) =>
          m.status === "FINISHED" &&
          m.winner &&
          ((m.homeTeam.id === a.team.id && m.awayTeam?.id === b.team.id) ||
            (m.homeTeam.id === b.team.id && m.awayTeam?.id === a.team.id))
      );
      if (h2h?.winner) {
        h2hTeams.add(a.team.id);
        h2hTeams.add(b.team.id);
      }
    }
  }

  return sorted.map((s) => ({ standing: s, h2h: h2hTeams.has(s.team.id) }));
}

export function GroupStandingsTable({
  groups,
  isAdmin,
  qualifyPerGroup = 2,
}: Props) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-400 text-sm">Los grupos se generan al iniciar el torneo</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const sorted = sortStandings(group.standings, group.matches);
        const hasH2h = sorted.some((r) => r.h2h);

        return (
          <div key={group.id}>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              {group.name}
            </h3>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Equipo</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">PJ</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">G</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">P</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">PF</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">PC</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">DF</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(({ standing: s, h2h }, i) => {
                    const pj = s.wins + s.losses;
                    const df = s.scored - s.against;
                    const qualifies = i < qualifyPerGroup;
                    return (
                      <tr
                        key={s.team.id}
                        className={`border-b border-gray-50 last:border-0 ${qualifies ? "bg-green-50/30" : ""}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${qualifies ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                              {i + 1}
                            </span>
                            <span className="font-medium text-gray-900">{s.team.name}</span>
                            {qualifies && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                Clasifica
                              </span>
                            )}
                            {h2h && (
                              <span className="text-xs text-amber-600 font-medium" title="Desempate por resultado directo">
                                DH
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-gray-500 tabular-nums">{pj}</td>
                        <td className="px-3 py-3 text-center font-semibold text-gray-900 tabular-nums">{s.wins}</td>
                        <td className="px-3 py-3 text-center text-gray-500 tabular-nums">{s.losses}</td>
                        <td className="px-3 py-3 text-center text-gray-500 tabular-nums">{s.scored}</td>
                        <td className="px-3 py-3 text-center text-gray-500 tabular-nums">{s.against}</td>
                        <td className="px-3 py-3 text-center tabular-nums">
                          <span className={`font-medium ${df > 0 ? "text-green-600" : df < 0 ? "text-red-500" : "text-gray-400"}`}>
                            {df > 0 ? `+${df}` : df}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-6 text-center text-gray-400 text-sm">
                        Sin posiciones todavia
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hasH2h && (
              <p className="text-xs text-amber-600 mb-3">
                <span className="font-semibold">DH</span> - Desempate por resultado directo
              </p>
            )}

            {group.matches.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Partidos</p>
                {group.matches.map((m) => (
                  <MatchRow key={m.id} match={m} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MatchRow({ match, isAdmin }: { match: MatchWithWinner; isAdmin?: boolean }) {
  const finished = match.status === "FINISHED";

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-5 py-3 text-sm hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-4">
        <span className="flex-1 text-right font-medium text-gray-800 truncate">{match.homeTeam.name}</span>
        <span className={`text-center font-mono text-xs px-3 py-1 rounded-lg tabular-nums min-w-[52px] ${finished ? "bg-gray-900 text-white font-bold" : "bg-gray-100 text-gray-500"}`}>
          {finished ? `${match.homeScore} - ${match.awayScore}` : "vs"}
        </span>
        <span className={`flex-1 font-medium truncate ${match.awayTeam ? "text-gray-800" : "text-gray-300 italic"}`}>
          {match.awayTeam?.name ?? "Equipo libre"}
        </span>
        {isAdmin && !finished && (
          <div className="flex items-center gap-3">
            <ScheduleMatchModal
              matchId={match.id}
              initialScheduledAt={typeof match.scheduledAt === "string" ? match.scheduledAt : match.scheduledAt?.toISOString()}
              initialLocation={match.location}
            />
            <ResultadoModal
              matchId={match.id}
              homeTeam={match.homeTeam.name}
              awayTeam={match.awayTeam?.name ?? ""}
            />
          </div>
        )}
        {isAdmin && finished && (
          <MatchAuditModal matchId={match.id} />
        )}
      </div>
      {(match.scheduledAt || match.location) && (
        <div className="mt-2 border-t border-gray-50 pt-2 text-xs text-gray-500">
          {match.scheduledAt && (
            <p>{new Date(match.scheduledAt).toLocaleString("es-AR")}</p>
          )}
          {match.location && (
            <p className="mt-0.5">{match.location}</p>
          )}
        </div>
      )}
    </div>
  );
}
