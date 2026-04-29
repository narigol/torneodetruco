"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  isKnockout?: boolean;
  seriesFormat?: "SINGLE" | "BEST_OF_3";
  regularGamePoints?: number;
  tiebreakerPoints?: number;
  matchPoints?: number;
};

type GameScore = { home: string; away: string };

export function ResultadoModal({
  matchId,
  homeTeam,
  awayTeam,
  isKnockout,
  seriesFormat = "SINGLE",
  regularGamePoints = 24,
  tiebreakerPoints = 30,
  matchPoints = 30,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [games, setGames] = useState<GameScore[]>([
    { home: "", away: "" },
    { home: "", away: "" },
    { home: "", away: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleOpen() {
    setHomeScore("");
    setAwayScore("");
    setGames([{ home: "", away: "" }, { home: "", away: "" }, { home: "", away: "" }]);
    setError("");
    setSaved(false);
    setOpen(true);
  }

  function updateGame(idx: number, side: "home" | "away", val: string) {
    setGames((prev) => prev.map((g, i) => i === idx ? { ...g, [side]: val } : g));
  }

  // Determine if game 3 is needed based on games 1 & 2
  function gamesWon(g1: GameScore, g2: GameScore) {
    let h = 0, a = 0;
    const p1h = parseInt(g1.home, 10), p1a = parseInt(g1.away, 10);
    const p2h = parseInt(g2.home, 10), p2a = parseInt(g2.away, 10);
    if (!isNaN(p1h) && !isNaN(p1a)) { if (p1h > p1a) h++; else if (p1a > p1h) a++; }
    if (!isNaN(p2h) && !isNaN(p2a)) { if (p2h > p2a) h++; else if (p2a > p2h) a++; }
    return { h, a };
  }

  const { h: winsAfter2, a: lossesAfter2 } = gamesWon(games[0], games[1]);
  const needsGame3 = seriesFormat === "BEST_OF_3" && winsAfter2 !== 2 && lossesAfter2 !== 2 &&
    (parseInt(games[0].home, 10) >= 0 || parseInt(games[1].home, 10) >= 0);
  const game3Active = seriesFormat === "BEST_OF_3" && winsAfter2 === 1 && lossesAfter2 === 1;

  async function submit() {
    setError("");

    if (seriesFormat === "BEST_OF_3") {
      const gameCount = game3Active ? 3 : 2;
      const payload = games.slice(0, gameCount).map((g) => ({
        home: parseInt(g.home, 10),
        away: parseInt(g.away, 10),
      }));

      for (const g of payload) {
        if (isNaN(g.home) || isNaN(g.away)) {
          setError("Completá todos los puntajes");
          return;
        }
      }

      setLoading(true);
      const res = await fetch(`/api/partidos/${matchId}/resultado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ games: payload }),
      });
      setLoading(false);

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al guardar");
        return;
      }
    } else {
      const h = parseInt(homeScore, 10);
      const a = parseInt(awayScore, 10);

      if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
        setError("Ingresá puntajes válidos");
        return;
      }
      if (h === a) {
        setError("No puede haber empate en truco");
        return;
      }

      setLoading(true);
      const res = await fetch(`/api/partidos/${matchId}/resultado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeScore: h, awayScore: a }),
      });
      setLoading(false);

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al guardar");
        return;
      }
    }

    setSaved(true);
    setTimeout(() => {
      setOpen(false);
      router.refresh();
    }, 800);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
      >
        Cargar resultado
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl max-h-[90vh] overflow-y-auto">
            {saved ? (
              <div className="flex flex-col items-center py-4 text-green-600">
                <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="font-medium">Resultado guardado</p>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900 mb-4">Cargar resultado</h3>

                {seriesFormat === "BEST_OF_3" ? (
                  <div className="space-y-4">
                    {[0, 1, 2].map((idx) => {
                      const isGame3 = idx === 2;
                      const target = isGame3 ? tiebreakerPoints : regularGamePoints;
                      const disabled = isGame3 && !game3Active;
                      return (
                        <div key={idx} className={disabled ? "opacity-40 pointer-events-none" : ""}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-500">
                              {isGame3 ? "Juego 3 — Desempate" : `Juego ${idx + 1}`}
                            </span>
                            <span className="text-xs text-gray-400">{target} pts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 text-center">
                              <p className="text-xs text-gray-400 mb-1 truncate">{homeTeam}</p>
                              <input
                                type="number"
                                min="0"
                                value={games[idx].home}
                                onChange={(e) => updateGame(idx, "home", e.target.value)}
                                placeholder="0"
                                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <span className="text-gray-300 font-mono mt-4">—</span>
                            <div className="flex-1 text-center">
                              <p className="text-xs text-gray-400 mb-1 truncate">{awayTeam}</p>
                              <input
                                type="number"
                                min="0"
                                value={games[idx].away}
                                onChange={(e) => updateGame(idx, "away", e.target.value)}
                                placeholder="0"
                                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                          </div>
                          {!disabled && !isGame3 && (
                            <p className="text-xs text-gray-400 mt-1 text-center">
                              {idx === 0 && games[0].home !== "" && games[0].away !== "" &&
                                (() => {
                                  const h = parseInt(games[0].home, 10), a = parseInt(games[0].away, 10);
                                  if (isNaN(h) || isNaN(a) || h === a) return null;
                                  return h > a ? `Gana ${homeTeam}` : `Gana ${awayTeam}`;
                                })()
                              }
                            </p>
                          )}
                          {isGame3 && !disabled && (
                            <p className="text-xs text-amber-600 mt-1 text-center font-medium">Serie empatada 1-1</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 text-center">
                      <p className="text-xs text-gray-500 mb-1 truncate">{homeTeam}</p>
                      <input
                        type="number"
                        min="0"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <span className="text-gray-300 font-mono text-lg mt-4">—</span>
                    <div className="flex-1 text-center">
                      <p className="text-xs text-gray-500 mb-1 truncate">{awayTeam}</p>
                      <input
                        type="number"
                        min="0"
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                )}

                {seriesFormat === "SINGLE" && (
                  <p className="text-xs text-gray-400 text-center mb-4">
                    El ganador debe llegar a {matchPoints} puntos
                  </p>
                )}

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4 mt-4">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? "Guardando..." : "Confirmar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
