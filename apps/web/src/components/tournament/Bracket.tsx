"use client";

import { useMemo, Fragment } from "react";
import Image from "next/image";
import { Phase } from "@tdt/db";
import { ResultadoModal } from "@/components/ui/ResultadoModal";
import { MatchAuditModal } from "@/components/ui/MatchAuditModal";

const PALOS = [
  "/icono_espada_sf.png",
  "/icono_bastos_sf.png",
  "/icono_copas_sf.png",
  "/icono_oro_sf.png",
];

function PaloAleatorio({ size = 40 }: { size?: number }) {
  const src = useMemo(() => PALOS[Math.floor(Math.random() * PALOS.length)], []);
  return <Image src={src} alt="palo" width={size} height={size} />;
}

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
};

const PHASE_ORDER: Phase[] = ["ROUND_OF_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];

const PHASE_LABEL: Record<Phase, string> = {
  GROUP: "Grupos",
  ROUND_OF_16: "Octavos",
  QUARTERFINAL: "Cuartos de final",
  SEMIFINAL: "Semifinal",
  FINAL: "Final",
};

const BASE_H = 128; // slot height for the first phase
const CARD_H = 96;  // altura estimada de la card (2 filas ~44px c/u + divisor + margen)
const CARD_W = 224;
const COL_GAP = 48;
const LABEL_H = 28;

/**
 * Computes the absolute `top` for every match card.
 * - First phase: positioned by round number.
 * - Later phases: centered on the average of their parent matches' centers,
 *   so the layout is correct regardless of which round numbers were assigned
 *   in the DB (works around the pre-orderBy bug).
 */
function computePositions(matches: BracketMatch[], phases: Phase[]): Map<string, number> {
  const tops = new Map<string, number>();

  for (let phaseIdx = 0; phaseIdx < phases.length; phaseIdx++) {
    const phase = phases[phaseIdx];
    const phaseMatches = matches
      .filter((m) => m.phase === phase)
      .sort((a, b) => (a.round ?? 0) - (b.round ?? 0));

    if (phaseIdx === 0) {
      for (const m of phaseMatches) {
        const r = m.round ?? 1;
        tops.set(m.id, LABEL_H + (r - 1) * BASE_H + (BASE_H - CARD_H) / 2);
      }
    } else {
      const prevPhase = phases[phaseIdx - 1];
      const prevMatches = matches.filter((m) => m.phase === prevPhase);

      for (const m of phaseMatches) {
        const teamIds = new Set(
          [m.homeTeam.id, m.awayTeam?.id].filter(Boolean) as string[]
        );
        // Parents: previous-phase matches whose winner is one of this match's teams
        const parents = prevMatches.filter((p) => p.winner && teamIds.has(p.winner.id));

        if (parents.length >= 1) {
          const parentCenters = parents.map((p) => (tops.get(p.id) ?? 0) + CARD_H / 2);
          const avgCenter = parentCenters.reduce((a, b) => a + b, 0) / parentCenters.length;
          tops.set(m.id, avgCenter - CARD_H / 2);
        } else {
          // Fallback (no winners yet — shouldn't happen since later phases only
          // exist after all previous phase matches finish)
          const r = m.round ?? 1;
          const slotH = BASE_H * Math.pow(2, phaseIdx);
          tops.set(m.id, LABEL_H + (r - 1) * slotH + (slotH - CARD_H) / 2);
        }
      }
    }
  }

  return tops;
}

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
        <div className="text-gray-300 mb-3"><PaloAleatorio /></div>
        <p className="text-gray-400 text-sm">La llave se genera al iniciar la fase eliminatoria</p>
      </div>
    );
  }

  const tops = computePositions(matches, phases);

  const firstPhaseCount = matches.filter((m) => m.phase === phases[0]).length;
  const totalHeight = LABEL_H + firstPhaseCount * BASE_H;
  const totalWidth = phases.length * CARD_W + (phases.length - 1) * COL_GAP;

  return (
    <div className="space-y-8">
      {champion && (
        <div className="flex flex-col items-center gap-2 py-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <div className="text-amber-500"><PaloAleatorio /></div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Campeon</p>
          <p className="text-2xl font-bold text-amber-800">{champion.name}</p>
        </div>
      )}
      <div className="overflow-x-auto pb-4">
        <div className="relative" style={{ height: totalHeight, width: totalWidth }}>
          {phases.map((phase, phaseIdx) => {
            const phaseMatches = matches.filter((m) => m.phase === phase);
            const colLeft = phaseIdx * (CARD_W + COL_GAP);
            const isLastPhase = phaseIdx === phases.length - 1;
            const nextPhaseMatches = isLastPhase
              ? []
              : matches.filter((m) => m.phase === phases[phaseIdx + 1]);

            return (
              <Fragment key={phase}>
                {/* Phase label */}
                <div
                  className="absolute text-xs font-bold text-gray-400 uppercase tracking-wider text-center"
                  style={{ left: colLeft, width: CARD_W, top: 0, lineHeight: `${LABEL_H}px` }}
                >
                  {PHASE_LABEL[phase]}
                </div>

                {phaseMatches.map((m) => {
                  const cardTop = tops.get(m.id) ?? 0;
                  const cardMidY = cardTop + CARD_H / 2;
                  const connectorX = colLeft + CARD_W;
                  const midX = connectorX + COL_GAP / 2;

                  // Find the next-phase match this match feeds into
                  const nextMatch = m.winner
                    ? nextPhaseMatches.find(
                        (nm) =>
                          nm.homeTeam.id === m.winner!.id ||
                          nm.awayTeam?.id === m.winner!.id
                      )
                    : undefined;

                  // junctionY = center of the next-phase match (which equals the
                  // average of its two parent centers, by construction)
                  const junctionY = nextMatch
                    ? (tops.get(nextMatch.id) ?? 0) + CARD_H / 2
                    : cardMidY;

                  // Top parent: this match is above or at the junction → it draws
                  // the final horizontal into the next-phase column
                  const isTopParent = cardMidY <= junctionY;

                  return (
                    <Fragment key={m.id}>
                      <div style={{ position: "absolute", top: cardTop, left: colLeft, width: CARD_W }}>
                        <BracketCard match={m} isAdmin={isAdmin} />
                      </div>

                      {!isLastPhase && nextMatch && (
                        <>
                          {/* Horizontal: card right → midX */}
                          <div style={{
                            position: "absolute",
                            top: cardMidY - 0.5,
                            left: connectorX,
                            width: COL_GAP / 2,
                            height: 1,
                            backgroundColor: "#d1d5db",
                          }} />
                          {/* Vertical: this card's center → junction */}
                          {Math.abs(cardMidY - junctionY) > 1 && (
                            <div style={{
                              position: "absolute",
                              top: Math.min(cardMidY, junctionY),
                              left: midX - 0.5,
                              width: 1,
                              height: Math.abs(cardMidY - junctionY),
                              backgroundColor: "#d1d5db",
                            }} />
                          )}
                          {/* Horizontal: midX → next column (only top/sole parent) */}
                          {isTopParent && (
                            <div style={{
                              position: "absolute",
                              top: junctionY - 0.5,
                              left: midX,
                              width: COL_GAP / 2,
                              height: 1,
                              backgroundColor: "#d1d5db",
                            }} />
                          )}
                        </>
                      )}
                    </Fragment>
                  );
                })}
              </Fragment>
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

      {isAdmin && !finished && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <ResultadoModal
            matchId={match.id}
            homeTeam={match.homeTeam.name}
            awayTeam={match.awayTeam!.name}
          />
        </div>
      )}
      {finished && match.winner && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-amber-700">{match.winner.name}</span>
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
