"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NuevoTorneoForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matchPoints, setMatchPoints] = useState(30);
  const [format, setFormat] = useState("GROUPS_AND_KNOCKOUT");
  const [seriesFormat, setSeriesFormat] = useState("SINGLE");
  const [regularGamePoints, setRegularGamePoints] = useState(24);
  const [tiebreakerPoints, setTiebreakerPoints] = useState(30);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (seriesFormat === "SINGLE" && matchPoints % 2 !== 0) {
      setError("Los puntos del partido deben ser un número par");
      return;
    }
    if (seriesFormat === "BEST_OF_3" && (regularGamePoints % 2 !== 0 || tiebreakerPoints % 2 !== 0)) {
      setError("Los puntos de cada juego deben ser un número par");
      return;
    }

    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/torneos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        format: form.get("format"),
        startDate: form.get("startDate") || null,
        matchPoints: seriesFormat === "SINGLE" ? matchPoints : regularGamePoints,
        qualifyPerGroup: format === "GROUPS_AND_KNOCKOUT" ? Number(form.get("qualifyPerGroup")) : 1,
        playersPerTeam: Number(form.get("playersPerTeam")),
        seriesFormat,
        regularGamePoints,
        tiebreakerPoints,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear el torneo");
      return;
    }

    const data = await res.json();
    router.push(`/torneos/${data.id}`);
    router.refresh();
  }

  const mitad = matchPoints / 2;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-xl p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input
          name="name"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Copa de Verano 2025"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          name="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          placeholder="Detalles del torneo..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Formato *</label>
        <select
          name="format"
          required
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="GROUPS_AND_KNOCKOUT">Grupos + Eliminatoria</option>
          <option value="SINGLE_ELIMINATION">Eliminación directa</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad *</label>
        <select
          name="playersPerTeam"
          defaultValue="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="1">1 vs 1 — Mano a mano</option>
          <option value="2">2 vs 2 — Parejas</option>
          <option value="3">3 vs 3 — Tríos</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sistema de partido *</label>
        <select
          value={seriesFormat}
          onChange={(e) => setSeriesFormat(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="SINGLE">Partido único</option>
          <option value="BEST_OF_3">Mejor de 3</option>
        </select>
      </div>

      {seriesFormat === "SINGLE" ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Puntos del partido *
            <span className="text-gray-400 font-normal ml-1">(debe ser par)</span>
          </label>
          <input
            type="number"
            min={2}
            step={2}
            value={matchPoints}
            onChange={(e) => setMatchPoints(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {matchPoints > 0 && matchPoints % 2 === 0 && (
            <p className="text-xs text-gray-400 mt-1">{mitad} malas + {mitad} buenas</p>
          )}
          {matchPoints % 2 !== 0 && (
            <p className="text-xs text-red-500 mt-1">Debe ser un número par</p>
          )}
        </div>
      ) : (
        <div className="space-y-3 border border-gray-100 rounded-xl p-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Puntos por juego</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Juegos 1 y 2 *
              <span className="text-gray-400 font-normal ml-1">(debe ser par)</span>
            </label>
            <input
              type="number"
              min={2}
              step={2}
              value={regularGamePoints}
              onChange={(e) => setRegularGamePoints(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
            {regularGamePoints > 0 && regularGamePoints % 2 === 0 && (
              <p className="text-xs text-gray-400 mt-1">{regularGamePoints / 2} malas + {regularGamePoints / 2} buenas</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Juego 3 (desempate) *
              <span className="text-gray-400 font-normal ml-1">(debe ser par)</span>
            </label>
            <input
              type="number"
              min={2}
              step={2}
              value={tiebreakerPoints}
              onChange={(e) => setTiebreakerPoints(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
            {tiebreakerPoints > 0 && tiebreakerPoints % 2 === 0 && (
              <p className="text-xs text-gray-400 mt-1">{tiebreakerPoints / 2} malas + {tiebreakerPoints / 2} buenas</p>
            )}
          </div>
        </div>
      )}

      {format === "GROUPS_AND_KNOCKOUT" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clasificados por grupo *</label>
          <select
            name="qualifyPerGroup"
            defaultValue="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="1">1 por grupo</option>
            <option value="2">2 por grupo</option>
            <option value="3">3 por grupo</option>
            <option value="4">4 por grupo</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
        <input
          name="startDate"
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creando..." : "Crear torneo"}
        </button>
      </div>
    </form>
  );
}
