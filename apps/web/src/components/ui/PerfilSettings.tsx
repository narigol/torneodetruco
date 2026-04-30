"use client";

import { useState } from "react";

type Props = {
  acceptsLocationInvites: boolean;
};

export function PerfilSettings({ acceptsLocationInvites: initial }: Props) {
  const [enabled, setEnabled] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function toggle() {
    setLoading(true);
    setSaved(false);
    const next = !enabled;
    const res = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acceptsLocationInvites: next }),
    });
    setLoading(false);
    if (res.ok) {
      setEnabled(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-1">Notificaciones e invitaciones</h2>
      <p className="text-xs text-gray-400 mb-5">
        Controlá si los organizadores pueden encontrarte e invitarte a torneos según tu zona.
      </p>

      <button
        onClick={toggle}
        disabled={loading}
        className="w-full flex items-center justify-between gap-4 text-left group disabled:opacity-60"
      >
        <div>
          <p className="text-sm font-medium text-gray-800">
            Recibir invitaciones por zona
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Los organizadores con plan PRO podrán buscarte por tu provincia o localidad e invitarte a sus torneos.
            También te llegarán notificaciones y mails cuando se creen torneos públicos cerca tuyo.
          </p>
        </div>
        <div
          className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
            enabled ? "bg-red-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </button>

      {saved && (
        <p className="text-xs text-green-600 mt-4">
          Preferencia guardada.
        </p>
      )}
    </div>
  );
}
