import { Phase } from "@tdt/db";
import { ResultadoModal } from "@/components/ui/ResultadoModal";

type BracketMatch = {
  id: string;
  round: number | null;
  phase: Phase;
  status: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  homeScore: number | null;
  awayScore: number | null;
  winner: { id: string; name: string } | null;
};

const PHASE_ORDER: Phase[] = ["ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];

const PHASE_LABEL: Record<Phase, string> = {
  GROUP: "Grupos",
  ROUND_OF_16: "Octavos",
  QUARTERFINAL: "Cuartos de final",
  SEMIFINAL: "Semifinal",
  FINAL: "Final",
};

type Props = { matches: BracketMatch[]; isAdmin?: boolean };

export function Bracket({ matches, isAdmin }: Props) {
  const phases = PHASE_ORDER.filter((p) => matches.some((m) => m.phase === p));

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-gray-400 text-sm">El bracket se genera al iniciar la fase eliminatoria</p>
      </div>
    );
  }

  return (
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
  );
}

function BracketCard({ match, isAdmin }: { match: BracketMatch; isAdmin?: boolean }) {
  const finished = match.status === "FINISHED";

  return (
    <div className="w-56 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <BracketTeamRow
        name={match.homeTeam.name}
        score={match.homeScore}
        isWinner={match.winner?.id === match.homeTeam.id}
        finished={finished}
      />
      <div className="h-px bg-gray-100 mx-3" />
      <BracketTeamRow
        name={match.awayTeam.name}
        score={match.awayScore}
        isWinner={match.winner?.id === match.awayTeam.id}
        finished={finished}
      />
      {isAdmin && !finished && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex justify-center">
          <ResultadoModal
            matchId={match.id}
            homeTeam={match.homeTeam.name}
            awayTeam={match.awayTeam.name}
            isKnockout
          />
        </div>
      )}
      {finished && match.winner && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 text-center">
          <span className="text-xs font-semibold text-amber-700">🏆 {match.winner.name}</span>
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
}: {
  name: string;
  score: number | null;
  isWinner: boolean;
  finished: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${isWinner ? "bg-green-50" : ""}`}>
      <span
        className={`text-sm truncate flex-1 mr-2 ${
          isWinner
            ? "font-semibold text-green-800"
            : finished
            ? "text-gray-400"
            : "text-gray-700"
        }`}
      >
        {name}
      </span>
      {finished && (
        <span className={`text-sm font-bold tabular-nums ${isWinner ? "text-green-700" : "text-gray-400"}`}>
          {score ?? 0}
        </span>
      )}
    </div>
  );
}
