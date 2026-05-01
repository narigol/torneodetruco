"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  matchId: string;
  initialScheduledAt?: string | null;
  initialLocation?: string | null;
};

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function ScheduleMatchModal({
  matchId,
  initialScheduledAt,
  initialLocation,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocal(initialScheduledAt));
  const [location, setLocation] = useState(initialLocation ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openModal() {
    setScheduledAt(toDatetimeLocal(initialScheduledAt));
    setLocation(initialLocation ?? "");
    setError("");
    setOpen(true);
  }

  async function save() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/partidos/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledAt: scheduledAt || null,
        location: location.trim() || null,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar la programacion.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={openModal}
        className="text-xs text-gray-500 hover:text-red-600 font-medium whitespace-nowrap"
      >
        {initialScheduledAt || initialLocation ? "Reprogramar" : "Programar"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Programar partido</h3>
            <p className="mt-1 text-sm text-gray-500">
              Defini fecha, hora y lugar para que quede visible en el torneo.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha y hora</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lugar</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Mesa 3, club, salon principal..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
