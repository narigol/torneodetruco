import { Phase } from "@tdt/db";
import { ResultadoModal } from "@/components/ui/ResultadoModal";
import { ScheduleMatchModal } from "@/components/ui/ScheduleMatchModal";
import { MatchAuditModal } from "@/components/ui/MatchAuditModal";

type GameScore = { home: number; away: number };

type BracketMatch = {
  id: string;
  round: number | null;
  phase: Phase;
  status: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string } | null;
  homeScore: number | null;
  awayScore: number | null;
  winner: { id: string; name: string } | null;
  games?: unknown;
  scheduledAt?: string | Date | null;
  location?: string | null;
};

const PHASE_ORDER: Phase[] = ["ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];

const PHASE_LABEL: Record<Phase, string> = {
  GROUP: "Grupos",
  ROUND_OF_16: "Octavos",
  QUARTERFINAL: "Cuartos de final",
  SEMIFINAL: "Semifinal",
  FINAL: "Final",
};

type Props = {
  matches: BracketMatch[];
  isAdmin?: boolean;
};

export function Bracket({ matches, isAdmin }: Props) {
  const phases = PHASE_ORDER.filter((p) => matches.some((m) => m.phase === p));
  const final = matches.find((m) => m.phase === "FINAL" && m.status === "FINISHED");
  const champion = final?.winner ?? null;

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-3">T</div>
        <p className="text-gray-400 text-sm">El bracket se genera al iniciar la fase eliminatoria</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {champion && (
        <div className="flex flex-col items-center gap-2 py-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <div className="text-4xl">T</div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Campeon</p>
          <p className="text-2xl font-bold text-amber-800">{champion.name}</p>
        </div>
      )}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-8 min-w-max">
          {phases.map((phase) => {
            const phaseMatches = matches
              .filter((m) => m.phase === phase)
              .sort((a, b) => (a.round ?? 0) - (b.round ?? 0));

            return (
              <div key={phase} className="flex flex-col">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-4 px-2">
                  {PHASE_LABEL[phase]}
                </div>
                <div className="flex flex-col justify-around gap-4 flex-1">
                  {phaseMatches.map((m) => (
                    <BracketCard key={m.id} match={m} isAdmin={isAdmin} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BracketCard({ match, isAdmin }: { match: BracketMatch; isAdmin?: boolean }) {
  const finished = match.status === "FINISHED";
  const games = (match.games as GameScore[] | null) ?? null;
  const isBest3 = Array.isArray(games) && games.length > 0;
  const isBye = match.awayTeam === null;

  if (isBye) {
    return (
      <div className="w-56 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm opacity-60">
        <BracketTeamRow
          name={match.homeTeam.name}
          score={null}
          isWinner
          finished={false}
          isBest3={false}
        />
        <div className="h-px bg-gray-100 mx-3" />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-gray-300 italic">Pase libre</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-56 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <BracketTeamRow
        name={match.homeTeam.name}
        score={match.homeScore}
        isWinner={match.winner?.id === match.homeTeam.id}
        finished={finished}
        isBest3={isBest3}
      />
      <div className="h-px bg-gray-100 mx-3" />
      <BracketTeamRow
        name={match.awayTeam!.name}
        score={match.awayScore}
        isWinner={match.winner?.id === match.awayTeam!.id}
        finished={finished}
        isBest3={isBest3}
      />

      {finished && isBest3 && games && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 space-y-1">
          {games.map((g, i) => {
            const homeWon = g.home > g.away;
            return (
              <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                <span className="text-gray-400">J{i + 1}</span>
                <span className={homeWon ? "font-semibold text-green-700" : ""}>{g.home}</span>
                <span className="text-gray-300">-</span>
                <span className={!homeWon ? "font-semibold text-green-700" : ""}>{g.away}</span>
              </div>
            );
          })}
        </div>
      )}

      {(match.scheduledAt || match.location) && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          {match.scheduledAt && (
            <p>{new Date(match.scheduledAt).toLocaleString("es-AR")}</p>
          )}
          {match.location && (
            <p className="mt-0.5 truncate">{match.location}</p>
          )}
        </div>
      )}

      {isAdmin && !finished && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <ScheduleMatchModal
            matchId={match.id}
            initialScheduledAt={typeof match.scheduledAt === "string" ? match.scheduledAt : match.scheduledAt?.toISOString()}
            initialLocation={match.location}
          />
          <ResultadoModal
            matchId={match.id}
            homeTeam={match.homeTeam.name}
            awayTeam={match.awayTeam!.name}
          />
        </div>
      )}
      {finished && match.winner && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-amber-700">T {match.winner.name}</span>
          {isAdmin && <MatchAuditModal matchId={match.id} />}
        </div>
      )}
    </div>
  );
}

function BracketTeamRow({
  name,
  score,
  isWinner,
  finished,
  isBest3,
}: {
  name: string;
  score: number | null;
  isWinner: boolean;
  finished: boolean;
  isBest3: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${isWinner ? "bg-green-50" : ""}`}>
      <span
        className={`text-sm truncate flex-1 mr-2 ${
          isWinner ? "font-semibold text-green-800" : finished ? "text-gray-400" : "text-gray-700"
        }`}
      >
        {name}
      </span>
      {finished && (
        <span className={`text-sm font-bold tabular-nums ${isWinner ? "text-green-700" : "text-gray-400"}`}>
          {isBest3 ? `${score ?? 0}J` : (score ?? 0)}
        </span>
      )}
    </div>
  );
}
