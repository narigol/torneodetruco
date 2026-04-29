"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Player = { id: string; name: string };

type Props = {
  tournamentId: string;
  players: Player[];
  playersPerTeam: number;
};

function playerAlias(name: string): string {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0];
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0].toUpperCase() : "";
  return firstName + lastInitial;
}

function generateTeamName(ids: string[], players: Player[]): string {
  return ids
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => playerAlias(p!.name))
    .join(" y ");
}

export function NuevoEquipoForm({ tournamentId, players, playersPerTeam }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [teamName, setTeamName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length < playersPerTeam
        ? [...prev, id]
        : prev;

      if (!nameEdited) {
        setTeamName(generateTeamName(next, players));
      }

      return next;
    });
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTeamName(e.target.value);
    setNameEdited(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (selectedIds.length === 0) {
      setError("Seleccioná al menos un jugador");
      return;
    }

    if (selectedIds.length !== playersPerTeam) {
      setError(`Este torneo requiere exactamente ${playersPerTeam} jugador${playersPerTeam !== 1 ? "es" : ""} por equipo`);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/equipos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: teamName, tournamentId, playerIds: selectedIds }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear el equipo");
      return;
    }

    router.push(`/torneos/${tournamentId}`);
    router.refresh();
  }

  const remaining = playersPerTeam - selectedIds.length;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-white border border-gray-100 rounded-xl p-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Jugadores *{" "}
          <span className="text-gray-400 font-normal">
            (seleccioná exactamente {playersPerTeam})
          </span>
        </label>

        {players.length === 0 ? (
          <p className="text-sm text-gray-400 py-3">
            No hay jugadores registrados. Creá jugadores primero.
          </p>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {players.map((player) => {
              const checked = selectedIds.includes(player.id);
              const disabled = !checked && selectedIds.length >= playersPerTeam;
              return (
                <label
                  key={player.id}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none ${
                    disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => togglePlayer(player.id)}
                    className="accent-red-600"
                  />
                  <span className="text-sm text-gray-800">{player.name}</span>
                </label>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-1">
          {selectedIds.length === playersPerTeam
            ? "Jugadores completos"
            : `Faltan ${remaining} jugador${remaining !== 1 ? "es" : ""}`}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del equipo *
        </label>
        <input
          name="name"
          required
          value={teamName}
          onChange={handleNameChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Seleccioná jugadores para generar el nombre"
        />
        {!nameEdited && selectedIds.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">Generado automáticamente · podés editarlo</p>
        )}
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
          disabled={loading || players.length === 0}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creando..." : "Crear equipo"}
        </button>
      </div>
    </form>
  );
}
