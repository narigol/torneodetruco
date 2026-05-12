"use client";

import { useState } from "react";

type Props = {
  tournamentId: string;
  initialInteresado: boolean;
  status: "ANNOUNCED" | "REGISTRATION";
};

export function InteresadoButton({ tournamentId, initialInteresado, status }: Props) {
  const [interesado, setInteresado] = useState(initialInteresado);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/torneos/${tournamentId}/interesado`, {
        method: interesado ? "DELETE" : "POST",
      });
      if (res.ok) setInteresado((prev) => !prev);
    } finally {
      setLoading(false);
    }
  }

  const hint =
    status === "ANNOUNCED"
      ? "Te avisamos cuando se abra la inscripción"
      : "Te notificamos las novedades del torneo";

  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-4 transition-colors ${
      interesado
        ? "bg-blue-50 border-blue-100"
        : "bg-white border-gray-100"
    }`}>
      <button
        onClick={toggle}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
          interesado
            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        } disabled:opacity-50`}
      >
        <svg className="w-4 h-4" fill={interesado ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {interesado ? "Me interesa" : "Me interesa"}
      </button>
      <p className="text-sm text-gray-500 min-w-0">
        {interesado
          ? <><span className="font-medium text-blue-700">Anotado.</span> {hint}.</>
          : hint + "."}
      </p>
    </div>
  );
}
