"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  isKnockout?: boolean;
};

export function ResultadoModal({ matchId, homeTeam, awayTeam, isKnockout }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleOpen() {
    setHomeScore("");
    setAwayScore("");
    setError("");
    setSaved(false);
    setOpen(true);
  }

  async function submit() {
    setError("");
    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);

    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError("Ingresá puntajes válidos");
      return;
    }
    if (isKnockout && h === a) {
      setError("En eliminatoria no puede haber empate");
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
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
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

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
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
