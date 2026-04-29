"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
};

type GameScore = { home: string; away: string };

export function ResultadoModal({ matchId, homeTeam, awayTeam }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Formato y puntos — se configuran al cargar el resultado
  const [seriesFormat, setSeriesFormat] = useState<"SINGLE" | "BEST_OF_3">("SINGLE");
  const [matchPoints, setMatchPoints] = useState("30");
  const [regularGamePoints, setRegularGamePoints] = useState("24");
  const [tiebreakerPoints, setTiebreakerPoints] = useState("30");

  // Scores
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
    setSeriesFormat("SINGLE");
    setMatchPoints("30");
    setRegularGamePoints("24");
    setTiebreakerPoints("30");
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

  function winsAfter2() {
    let h = 0, a = 0;
    for (let i = 0; i < 2; i++) {
      const gh = parseInt(games[i].home, 10), ga = parseInt(games[i].away, 10);
      if (!isNaN(gh) && !isNaN(ga) && gh !== ga) {
        if (gh > ga) h++; else a++;
      }
    }
    return { h, a };
  }

  const { h: homeW, a: awayW } = winsAfter2();
  const game3Active = seriesFormat === "BEST_OF_3" && homeW === 1 && awayW === 1;

  async function submit() {
    setError("");

    let body: Record<string, unknown>;

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

      body = {
        seriesFormat: "BEST_OF_3",
        games: payload,
        ...(regularGamePoints ? { regularGamePoints: parseInt(regularGamePoints, 10) } : {}),
        ...(tiebreakerPoints ? { tiebreakerPoints: parseInt(tiebreakerPoints, 10) } : {}),
      };
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

      body = {
        homeScore: h,
        awayScore: a,
        ...(matchPoints ? { matchPoints: parseInt(matchPoints, 10) } : {}),
      };
    }

    setLoading(true);
    const res = await fetch(`/api/partidos/${matchId}/resultado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
      return;
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
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl max-h-[90vh] overflow-y-auto">
            {saved ? (
              <div className="flex flex-col items-center py-6 text-green-600">
                <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="font-medium">Resultado guardado</p>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900 mb-1">Cargar resultado</h3>
                <p className="text-xs text-gray-400 mb-5">{homeTeam} vs {awayTeam}</p>

                {/* Formato */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sistema</p>
                  <div className="flex gap-2">
                    {(["SINGLE", "BEST_OF_3"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setSeriesFormat(f)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                          seriesFormat === f
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {f === "SINGLE" ? "Partido único" : "Mejor de 3"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Puntos */}
                {seriesFormat === "SINGLE" ? (
                  <div className="mb-5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Puntos del partido
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={matchPoints}
                      onChange={(e) => setMatchPoints(e.target.value)}
                      className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                ) : (
                  <div className="flex gap-3 mb-5">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Pts J1 y J2
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={regularGamePoints}
                        onChange={(e) => setRegularGamePoints(e.target.value)}
                        className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Pts J3 (desempate)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tiebreakerPoints}
                        onChange={(e) => setTiebreakerPoints(e.target.value)}
                        className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                )}

                <div className="h-px bg-gray-100 mb-5" />

                {/* Scores */}
                {seriesFormat === "BEST_OF_3" ? (
                  <div className="space-y-4">
                    {[0, 1, 2].map((idx) => {
                      const isGame3 = idx === 2;
                      const disabled = isGame3 && !game3Active;
                      const pts = isGame3 ? tiebreakerPoints : regularGamePoints;
                      return (
                        <div key={idx} className={disabled ? "opacity-40 pointer-events-none" : ""}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-500">
                              {isGame3 ? "Juego 3 — Desempate" : `Juego ${idx + 1}`}
                            </span>
                            {pts && <span className="text-xs text-gray-400">{pts} pts</span>}
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
                                className="w-full border border-gray-200 rounded-xl px-2 py-2.5 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <span className="text-gray-300 font-mono mt-5">—</span>
                            <div className="flex-1 text-center">
                              <p className="text-xs text-gray-400 mb-1 truncate">{awayTeam}</p>
                              <input
                                type="number"
                                min="0"
                                value={games[idx].away}
                                onChange={(e) => updateGame(idx, "away", e.target.value)}
                                placeholder="0"
                                className="w-full border border-gray-200 rounded-xl px-2 py-2.5 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                          </div>
                          {isGame3 && !disabled && (
                            <p className="text-xs text-amber-600 mt-1 text-center font-medium">Serie empatada 1-1</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-center">
                      <p className="text-xs text-gray-500 mb-1.5 truncate">{homeTeam}</p>
                      <input
                        type="number"
                        min="0"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-xl px-2 py-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <span className="text-gray-300 font-mono text-xl mt-5">—</span>
                    <div className="flex-1 text-center">
                      <p className="text-xs text-gray-500 mb-1.5 truncate">{awayTeam}</p>
                      <input
                        type="number"
                        min="0"
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-xl px-2 py-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl mt-4">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="flex-1 px-3 py-2.5 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors font-semibold"
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
