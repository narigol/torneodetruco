"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  torneo: {
    id: string;
    name: string;
    description: string | null;
    format: string;
    status: string;
    startDate: string | null;
    matchPoints: number;
    qualifyPerGroup: number;
    playersPerTeam: number;
    seriesFormat: string;
    regularGamePoints: number;
    tiebreakerPoints: number;
  };
};

export function EditarTorneoForm({ torneo }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canEditStructure = torneo.status === "DRAFT" || torneo.status === "REGISTRATION";

  const [seriesFormat, setSeriesFormat] = useState(torneo.seriesFormat);
  const [matchPoints, setMatchPoints] = useState(torneo.matchPoints);
  const [regularGamePoints, setRegularGamePoints] = useState(torneo.regularGamePoints);
  const [tiebreakerPoints, setTiebreakerPoints] = useState(torneo.tiebreakerPoints);

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

    const form = new FormData(e.currentTarget);
    setLoading(true);

    const body: Record<string, unknown> = {
      name: form.get("name"),
      description: form.get("description") || null,
      startDate: form.get("startDate") || null,
      seriesFormat,
      matchPoints: seriesFormat === "SINGLE" ? matchPoints : regularGamePoints,
      regularGamePoints,
      tiebreakerPoints,
    };

    if (canEditStructure) {
      body.format = form.get("format");
      body.playersPerTeam = Number(form.get("playersPerTeam"));
      body.qualifyPerGroup = form.get("format") === "GROUPS_AND_KNOCKOUT"
        ? Number(form.get("qualifyPerGroup"))
        : 1;
    }

    const res = await fetch(`/api/torneos/${torneo.id}`, {
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

    router.push(`/torneos/${torneo.id}`);
    router.refresh();
  }

  const startDateValue = torneo.startDate
    ? new Date(torneo.startDate).toISOString().split("T")[0]
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-xl p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input
          name="name"
          required
          defaultValue={torneo.name}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={torneo.description ?? ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Formato *</label>
        <select
          name="format"
          defaultValue={torneo.format}
          disabled={!canEditStructure}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="GROUPS_AND_KNOCKOUT">Grupos + Eliminatoria</option>
          <option value="SINGLE_ELIMINATION">Eliminación directa</option>
        </select>
        {!canEditStructure && (
          <p className="text-xs text-gray-400 mt-1">No editable una vez iniciado el torneo</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad *</label>
        <select
          name="playersPerTeam"
          defaultValue={String(torneo.playersPerTeam)}
          disabled={!canEditStructure}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="1">1 vs 1 — Mano a mano</option>
          <option value="2">2 vs 2 — Parejas</option>
          <option value="3">3 vs 3 — Tríos</option>
        </select>
        {!canEditStructure && (
          <p className="text-xs text-gray-400 mt-1">No editable una vez iniciado el torneo</p>
        )}
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
            <p className="text-xs text-gray-400 mt-1">{matchPoints / 2} malas + {matchPoints / 2} buenas</p>
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
            {regularGamePoints % 2 === 0 && (
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
            {tiebreakerPoints % 2 === 0 && (
              <p className="text-xs text-gray-400 mt-1">{tiebreakerPoints / 2} malas + {tiebreakerPoints / 2} buenas</p>
            )}
          </div>
        </div>
      )}

      {canEditStructure && torneo.format === "GROUPS_AND_KNOCKOUT" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clasificados por grupo *</label>
          <select
            name="qualifyPerGroup"
            defaultValue={String(torneo.qualifyPerGroup)}
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
          defaultValue={startDateValue}
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
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
