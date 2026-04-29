"use client";

import { useState } from "react";
import { MapaPreview } from "./MapaPreview";
import { useRouter } from "next/navigation";

type Props = {
  torneo: {
    id: string;
    name: string;
    description: string | null;
    format: string;
    status: string;
    startDate: string | null;
    startTime: string | null;
    location: string | null;
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

  const [format, setFormat] = useState(torneo.format);
  const [seriesFormat, setSeriesFormat] = useState(torneo.seriesFormat);
  const [matchPoints, setMatchPoints] = useState(torneo.matchPoints);
  const [regularGamePoints, setRegularGamePoints] = useState(torneo.regularGamePoints);
  const [tiebreakerPoints, setTiebreakerPoints] = useState(torneo.tiebreakerPoints);
  const [location, setLocation] = useState(torneo.location ?? "");


  const startDateValue = torneo.startDate
    ? new Date(torneo.startDate).toISOString().split("T")[0]
    : "";

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
      startTime: form.get("startTime") || null,
      location: location.trim() || null,
      seriesFormat,
      matchPoints: seriesFormat === "SINGLE" ? matchPoints : regularGamePoints,
      regularGamePoints,
      tiebreakerPoints,
    };

    if (canEditStructure) {
      body.format = format;
      body.playersPerTeam = Number(form.get("playersPerTeam"));
      body.qualifyPerGroup = format === "GROUPS_AND_KNOCKOUT"
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Tarjeta izquierda — Info básica y ubicación */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Información general</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
            <input
              name="name"
              required
              defaultValue={torneo.name}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={torneo.description ?? ""}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de inicio</label>
              <input
                name="startDate"
                type="date"
                defaultValue={startDateValue}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Horario</label>
              <input
                name="startTime"
                type="text"
                defaultValue={torneo.startTime ?? ""}
                placeholder="15:00 hs"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección / Ubicación</label>
            <input
              name="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Dirección o link de Google Maps"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
            />
          </div>

          <MapaPreview location={location} />
        </div>

        {/* Tarjeta derecha — Configuración */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Configuración</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Formato *</label>
            <select
              name="format"
              value={format}
              onChange={(e) => canEditStructure && setFormat(e.target.value)}
              disabled={!canEditStructure}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <option value="GROUPS_AND_KNOCKOUT">Grupos + Eliminatoria</option>
              <option value="SINGLE_ELIMINATION">Eliminación directa</option>
            </select>
            {!canEditStructure && (
              <p className="text-xs text-gray-400 mt-1">No editable una vez iniciado el torneo</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Modalidad *</label>
            <select
              name="playersPerTeam"
              defaultValue={String(torneo.playersPerTeam)}
              disabled={!canEditStructure}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sistema de partido *</label>
            <select
              value={seriesFormat}
              onChange={(e) => setSeriesFormat(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
            >
              <option value="SINGLE">Partido único</option>
              <option value="BEST_OF_3">Mejor de 3</option>
            </select>
          </div>

          {seriesFormat === "SINGLE" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Puntos del partido *
                <span className="text-gray-400 font-normal ml-1 text-xs">(par)</span>
              </label>
              <input
                type="number"
                min={2}
                step={2}
                value={matchPoints}
                onChange={(e) => setMatchPoints(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              />
              {matchPoints > 0 && matchPoints % 2 === 0 && (
                <p className="text-xs text-gray-400 mt-1">{matchPoints / 2} malas + {matchPoints / 2} buenas</p>
              )}
              {matchPoints % 2 !== 0 && (
                <p className="text-xs text-red-500 mt-1">Debe ser un número par</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 border border-gray-100 rounded-xl p-4 bg-gray-50/50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Puntos por juego</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Juegos 1 y 2 *
                  <span className="text-gray-400 font-normal ml-1 text-xs">(par)</span>
                </label>
                <input
                  type="number"
                  min={2}
                  step={2}
                  value={regularGamePoints}
                  onChange={(e) => setRegularGamePoints(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                />
                {regularGamePoints % 2 === 0 && (
                  <p className="text-xs text-gray-400 mt-1">{regularGamePoints / 2} malas + {regularGamePoints / 2} buenas</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Juego 3 — Desempate *
                  <span className="text-gray-400 font-normal ml-1 text-xs">(par)</span>
                </label>
                <input
                  type="number"
                  min={2}
                  step={2}
                  value={tiebreakerPoints}
                  onChange={(e) => setTiebreakerPoints(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                />
                {tiebreakerPoints % 2 === 0 && (
                  <p className="text-xs text-gray-400 mt-1">{tiebreakerPoints / 2} malas + {tiebreakerPoints / 2} buenas</p>
                )}
              </div>
            </div>
          )}

          {format === "GROUPS_AND_KNOCKOUT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Clasificados por grupo *</label>
              <select
                name="qualifyPerGroup"
                defaultValue={String(torneo.qualifyPerGroup)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              >
                <option value="1">1 por grupo</option>
                <option value="2">2 por grupo</option>
                <option value="3">3 por grupo</option>
                <option value="4">4 por grupo</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">{error}</p>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
