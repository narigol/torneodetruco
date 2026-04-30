"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArgentinaGeoSelect } from "./ArgentinaGeoSelect";

type Player = { id: string; name: string; dni: string | null; isFollowed: boolean };

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

export function NuevoEquipoForm({ tournamentId, players: initialPlayers, playersPerTeam }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  // Player list managed locally so new players appear immediately
  const [playerList, setPlayerList] = useState<Player[]>(initialPlayers);

  // New player form state
  const [newName, setNewName] = useState("");
  const [newDni, setNewDni] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newLocality, setNewLocality] = useState("");
  const [newProvince, setNewProvince] = useState("");
  const [newCountry, setNewCountry] = useState("Argentina");
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState("");
  const [newSuccess, setNewSuccess] = useState("");

  const visiblePlayers = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("es-AR");
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return playerList.filter((player) => {
      if (selectedIds.includes(player.id)) return true;
      if (terms.length === 0) return true;
      const normalizedName = player.name.toLocaleLowerCase("es-AR");
      const normalizedDni = player.dni ?? "";
      return terms.every((term) => normalizedName.includes(term) || normalizedDni.includes(term));
    });
  }, [deferredQuery, playerList, selectedIds]);

  const hasFollowedPlayers = playerList.some((p) => p.isFollowed);
  const teamName = generateTeamName(selectedIds, playerList);

  function togglePlayer(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length < playersPerTeam
          ? [...prev, id]
          : prev
    );
  }

  async function handleCreatePlayer(e: React.FormEvent) {
    e.preventDefault();
    setNewError("");
    setNewSuccess("");
    if (!newName.trim()) return;

    setNewLoading(true);
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        email: newEmail.trim(),
        dni: newDni.trim() || null,
        locality: newLocality.trim() || null,
        province: newProvince || null,
      }),
    });
    setNewLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setNewError(data.error ?? "Error al crear jugador");
      return;
    }

    const created = await res.json();
    // Use the linked Player ID for team assignment
    const playerId = created.player?.id ?? created.id;
    const newPlayer: Player = { id: playerId, name: created.name, dni: created.dni ?? null, isFollowed: false };
    setPlayerList((prev) => [...prev, newPlayer].sort((a, b) => a.name.localeCompare(b.name, "es")));

    // Auto-select if there's room
    if (selectedIds.length < playersPerTeam) {
      setSelectedIds((prev) => [...prev, created.id]);
    }

    setNewSuccess(`"${created.name}" agregado`);
    setNewName("");
    setNewDni("");
    setNewEmail("");
    setNewLocality("");
    setNewProvince("");
    setNewCountry("Argentina");
    setTimeout(() => setNewSuccess(""), 3000);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      {/* Tarjeta izquierda — Armar equipo */}
      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Armar equipo</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jugadores{" "}
            <span className="text-gray-400 font-normal">(selecciona exactamente {playersPerTeam})</span>
          </label>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 mb-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
            placeholder="Buscar por nombre o DNI..."
          />

          {hasFollowedPlayers && !deferredQuery.trim() && (
            <p className="text-xs text-gray-500 mb-2">
              Primero se muestran los jugadores que seguís.
            </p>
          )}

          {playerList.length === 0 ? (
            <p className="text-sm text-gray-400 py-3">No hay jugadores. Creá uno desde el panel derecho.</p>
          ) : visiblePlayers.length === 0 ? (
            <p className="text-sm text-gray-400 py-3">Sin resultados para esa búsqueda.</p>
          ) : (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {visiblePlayers.map((player) => {
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
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm text-gray-800">{player.name}</span>
                      <span className="text-xs text-gray-400">
                        {player.dni && `DNI ${player.dni}`}
                        {player.dni && player.isFollowed && " · "}
                        {player.isFollowed && <span className="text-red-500">Lo seguís</span>}
                      </span>
                    </div>
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

        {teamName && (
          <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-400 mb-0.5">Nombre del equipo</p>
            <p className="text-sm font-medium text-gray-800">{teamName}</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || selectedIds.length !== playersPerTeam}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando..." : "Crear equipo"}
          </button>
        </div>
      </form>

      {/* Tarjeta derecha — Nuevo jugador */}
      <form onSubmit={handleCreatePlayer} className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nuevo jugador</p>
        <p className="text-xs text-gray-400 -mt-3">
          Si el jugador no está en la lista, crealo acá y se agregará automáticamente.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
            placeholder="Nombre completo"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">DNI</label>
            <input
              value={newDni}
              onChange={(e) => setNewDni(e.target.value)}
              inputMode="numeric"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              placeholder="12345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              type="email"
              required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              placeholder="jugador@email.com"
            />
          </div>
        </div>

        <ArgentinaGeoSelect
          locality={newLocality}
          province={newProvince}
          onLocalityChange={setNewLocality}
          onProvinceChange={setNewProvince}
        />

        {newError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{newError}</p>
        )}
        {newSuccess && (
          <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{newSuccess}</p>
        )}

        <button
          type="submit"
          disabled={newLoading || !newName.trim()}
          className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {newLoading ? "Guardando..." : "Agregar jugador"}
        </button>
      </form>

    </div>
  );
}
