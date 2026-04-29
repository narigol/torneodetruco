"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  initial: {
    tournamentPlayedPoints: number;
    matchPlayedPoints: number;
    groupWinPoints: number;
    roundOf16WinPoints: number;
    quarterfinalWinPoints: number;
    semifinalWinPoints: number;
    finalWinPoints: number;
  };
};

export function RankingConfigForm({ initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function updateValue<K extends keyof typeof values>(key: K, value: number) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/ranking-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No pudimos guardar la configuracion");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  const fields: Array<{ key: keyof typeof values; label: string; hint: string }> = [
    { key: "tournamentPlayedPoints", label: "Torneo jugado", hint: "Puntos por participar en un torneo" },
    { key: "matchPlayedPoints", label: "Partido jugado", hint: "Puntos por cada partido finalizado" },
    { key: "groupWinPoints", label: "Victoria en grupos", hint: "Puntos por ganar un partido de grupos" },
    { key: "roundOf16WinPoints", label: "Victoria en octavos", hint: "Puntos por ganar en octavos" },
    { key: "quarterfinalWinPoints", label: "Victoria en cuartos", hint: "Puntos por ganar en cuartos" },
    { key: "semifinalWinPoints", label: "Victoria en semifinal", hint: "Puntos por ganar en semifinal" },
    { key: "finalWinPoints", label: "Victoria en final", hint: "Puntos por ganar la final" },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Configuracion del ranking</h2>
        <p className="text-sm text-gray-500 mt-1">
          Ajusta cuanto suma cada participacion y cada victoria por fase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
            </label>
            <input
              type="number"
              min={0}
              value={values[field.key]}
              onChange={(e) => updateValue(field.key, Number(e.target.value))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 px-3.5 py-3 rounded-xl">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-100 px-3.5 py-3 rounded-xl">
          Configuracion guardada.
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? "Guardando..." : "Guardar configuracion"}
        </button>
      </div>
    </form>
  );
}
