"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Organizer = { id: string; name: string };
type Tournament = { id: string; name: string };

type Props = {
  organizers: Organizer[];
  tournaments?: Tournament[];
};

export function RankingOrganizerFilter({ organizers, tournaments }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentOrganizer = searchParams.get("organizador") ?? "";
  const currentTournament = searchParams.get("torneo") ?? "";
  const currentUsuario = searchParams.get("usuario") ?? "";
  const [usuarioInput, setUsuarioInput] = useState(currentUsuario);

  function navigate(organizador: string, torneo: string, usuario: string) {
    const params = new URLSearchParams();
    if (organizador) params.set("organizador", organizador);
    if (torneo) params.set("torneo", torneo);
    if (usuario) params.set("usuario", usuario);
    startTransition(() => router.push(`/ranking?${params.toString()}`));
  }

  function handleOrganizerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(e.target.value, "", usuarioInput);
  }

  function handleTournamentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(currentOrganizer, e.target.value, usuarioInput);
  }

  function handleUsuarioChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsuarioInput(e.target.value);
  }

  function handleUsuarioKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") navigate(currentOrganizer, currentTournament, usuarioInput);
  }

  function handleUsuarioBlur() {
    if (usuarioInput !== currentUsuario) navigate(currentOrganizer, currentTournament, usuarioInput);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500 shrink-0">Organizador</label>
        <select
          value={currentOrganizer}
          onChange={handleOrganizerChange}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
        >
          <option value="">Todos</option>
          {organizers.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {tournaments && tournaments.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 shrink-0">Torneo</label>
          <select
            value={currentTournament}
            onChange={handleTournamentChange}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            <option value="">Todos</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500 shrink-0">Jugador</label>
        <input
          type="text"
          value={usuarioInput}
          onChange={handleUsuarioChange}
          onKeyDown={handleUsuarioKeyDown}
          onBlur={handleUsuarioBlur}
          placeholder="Buscar por nombre..."
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 w-48"
        />
      </div>
    </div>
  );
}
