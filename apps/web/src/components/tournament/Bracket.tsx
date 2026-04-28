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

const PHASE_ORDER: Phase[] = [
  "ROUND_OF_16",
  "QUARTERFINAL",
  "SEMIFINAL",
  "FINAL",
];

const PHASE_LABEL: Record<Phase, string> = {
  GROUP: "Grupos",
  ROUND_OF_16: "Octavos",
  QUARTERFINAL: "Cuartos",
  SEMIFINAL: "Semifinal",
  FINAL: "Final",
};

type Props = {
  matches: BracketMatch[];
  isAdmin?: boolean;
};

export function Bracket({ matches, isAdmin }: Props) {
  const phases = PHASE_ORDER.filter((p) =>
    matches.some((m) => m.phase === p)
  );

  if (matches.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-8">
        El bracket se genera al iniciar la fase eliminatoria
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max pb-4">
        {phases.map((phase) => {
          const phaseMatches = matches
            .filter((m) => m.phase === phase)
            .sort((a, b) => (a.round ?? 0) - (b.round ?? 0));

          return (
            <div key={phase} className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase text-center">
                {PHASE_LABEL[phase]}
              </h3>
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

function BracketCard({
  match,
  isAdmin,
}: {
  match: BracketMatch;
  isAdmin?: boolean;
}) {
  const finished = match.status === "FINISHED";

  return (
    <div className="w-52 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      <BracketTeamRow
        name={match.homeTeam.name}
        score={match.homeScore}
        isWinner={match.winner?.id === match.homeTeam.id}
        finished={finished}
      />
      <div className="h-px bg-gray-100" />
      <BracketTeamRow
        name={match.awayTeam.name}
        score={match.awayScore}
        isWinner={match.winner?.id === match.awayTeam.id}
        finished={finished}
      />
      {isAdmin && !finished && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex justify-end">
          <ResultadoModal
            matchId={match.id}
            homeTeam={match.homeTeam.name}
            awayTeam={match.awayTeam.name}
            isKnockout
          />
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
    <div
      className={`flex items-center justify-between px-3 py-2.5 ${
        isWinner ? "bg-green-50" : ""
      }`}
    >
      <span
        className={`text-sm truncate flex-1 ${
          isWinner ? "font-semibold text-green-800" : "text-gray-700"
        } ${finished && !isWinner ? "text-gray-400" : ""}`}
      >
        {name}
      </span>
      {finished && (
        <span
          className={`text-sm font-bold ml-2 ${
            isWinner ? "text-green-700" : "text-gray-400"
          }`}
        >
          {score ?? 0}
        </span>
      )}
    </div>
  );
}
