"use client";

import { useState } from "react";
import { MapaPreview } from "./MapaPreview";
import { ArgentinaGeoSelect } from "./ArgentinaGeoSelect";
import { useRouter } from "next/navigation";

type ReglamentoOption = { id: string; nombre: string };

type Props = {
  reglamentos: ReglamentoOption[];
};

export function NuevoTorneoForm({ reglamentos }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [format, setFormat] = useState("GROUPS_AND_KNOCKOUT");
  const [location, setLocation] = useState("");
  const [locality, setLocality] = useState("");
  const [province, setProvince] = useState("");
  const [reglamentoId, setReglamentoId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/torneos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        format,
        startDate: form.get("startDate") || null,
        startTime: form.get("startTime") || null,
        location: location.trim() || null,
        locality: locality.trim() || null,
        province: province || null,
        playersPerTeam: Number(form.get("playersPerTeam")),
        maxPlayers: form.get("maxPlayers") ? Number(form.get("maxPlayers")) : null,
        reglamentoId: reglamentoId || null,
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
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              placeholder="Copa de Verano 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors resize-none"
              placeholder="Detalles del torneo..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de inicio</label>
              <input
                name="startDate"
                type="date"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Horario</label>
              <input
                name="startTime"
                type="text"
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

        {/* Tarjeta derecha — Configuración del torneo */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Configuración</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Formato *</label>
            <select
              name="format"
              required
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
            >
              <option value="GROUPS_AND_KNOCKOUT">Grupos + Eliminatoria</option>
              <option value="SINGLE_ELIMINATION">Eliminación directa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Modalidad *</label>
            <select
              name="playersPerTeam"
              defaultValue="2"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
            >
              <option value="1">1 vs 1 — Mano a mano</option>
              <option value="2">2 vs 2 — Parejas</option>
              <option value="3">3 vs 3 — Tríos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cupo máximo de jugadores</label>
            <input
              name="maxPlayers"
              type="number"
              min="2"
              step="1"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              placeholder="Sin límite"
            />
            <p className="text-xs text-gray-400 mt-1">Opcional. Impide inscribir más jugadores al alcanzar el límite.</p>
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
          {loading ? "Creando..." : "Crear torneo"}
        </button>
      </div>
    </form>
  );
}
