"use client";

import { useState } from "react";
import { MapaPreview } from "./MapaPreview";
import { ArgentinaGeoSelect } from "./ArgentinaGeoSelect";
import { useRouter } from "next/navigation";

type ReglamentoOption = { id: string; nombre: string };

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
    locality: string | null;
    province: string | null;
    playersPerTeam: number;
    maxPlayers: number | null;
    reglamentoId: string | null;
  };
  reglamentos: ReglamentoOption[];
};

export function EditarTorneoForm({ torneo, reglamentos }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canEditStructure = torneo.status === "DRAFT" || torneo.status === "REGISTRATION";

  const [format, setFormat] = useState(torneo.format);
  const [location, setLocation] = useState(torneo.location ?? "");
  const [locality, setLocality] = useState(torneo.locality ?? "");
  const [province, setProvince] = useState(torneo.province ?? "");
  const [reglamentoId, setReglamentoId] = useState(torneo.reglamentoId ?? "");

  const startDateValue = torneo.startDate
    ? new Date(torneo.startDate).toISOString().split("T")[0]
    : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    setLoading(true);

    const body: Record<string, unknown> = {
      name: form.get("name"),
      description: form.get("description") || null,
      startDate: form.get("startDate") || null,
      startTime: form.get("startTime") || null,
      location: location.trim() || null,
      locality: locality.trim() || null,
      province: province || null,
      maxPlayers: form.get("maxPlayers") ? Number(form.get("maxPlayers")) : null,
      reglamentoId: reglamentoId || null,
    };

    if (canEditStructure) {
      body.format = format;
      body.playersPerTeam = Number(form.get("playersPerTeam"));
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

          <ArgentinaGeoSelect
            locality={locality}
            province={province}
            onLocalityChange={setLocality}
            onProvinceChange={setProvince}
          />

          <MapaPreview location={location} onLocationChange={setLocation} />
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cupo máximo de jugadores</label>
            <input
              name="maxPlayers"
              type="number"
              min="2"
              step="1"
              defaultValue={torneo.maxPlayers ?? ""}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              placeholder="Sin límite"
            />
            <p className="text-xs text-gray-400 mt-1">Opcional. Dejá vacío para no limitar.</p>
          </div>

          {reglamentos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reglamento</label>
              <select
                value={reglamentoId}
                onChange={(e) => setReglamentoId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              >
                <option value="">Sin reglamento</option>
                {reglamentos.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
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
