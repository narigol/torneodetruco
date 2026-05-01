"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  tournamentId: string;
  playersPerTeam: number;
  loggedIn: boolean;
  callbackUrl: string;
};

export function PublicTournamentActions({
  tournamentId,
  playersPerTeam,
  loggedIn,
  callbackUrl,
}: Props) {
  const [inscripto, setInscripto] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [partnerDni, setPartnerDni] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const needsPartner = playersPerTeam > 1;

  async function handleSubmit() {
    setError("");
    if (needsPartner && !partnerName.trim()) {
      setError("El nombre de tu companero es obligatorio.");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/torneos/${tournamentId}/inscribirse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerName: partnerName.trim() || undefined,
        partnerDni: partnerDni.trim() || undefined,
        partnerEmail: partnerEmail.trim() || undefined,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo completar la inscripcion.");
      return;
    }

    setInscripto(true);
    setShowForm(false);
  }

  if (!loggedIn) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
      >
        Iniciar sesion para inscribirme
      </Link>
    );
  }

  if (inscripto) {
    return (
      <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
        Ya quedaste inscripto en este torneo.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Quiero inscribirme
        </button>
      ) : (
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          {needsPartner && (
            <>
              <input
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Nombre de tu companero"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={partnerDni}
                  onChange={(e) => setPartnerDni(e.target.value)}
                  placeholder="DNI (opcional)"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <input
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="Email (opcional)"
                  type="email"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Enviando..." : "Confirmar inscripcion"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
