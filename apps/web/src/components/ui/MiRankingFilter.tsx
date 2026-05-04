"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Tournament = { id: string; name: string };

export function MiRankingFilter({ tournaments }: { tournaments: Tournament[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentTorneo = searchParams.get("torneo") ?? "";
  const currentUsuario = searchParams.get("usuario") ?? "";
  const [usuarioInput, setUsuarioInput] = useState(currentUsuario);

  function navigate(torneo: string, usuario: string) {
    const params = new URLSearchParams();
    if (torneo) params.set("torneo", torneo);
    if (usuario) params.set("usuario", usuario);
    startTransition(() => router.push(`/organizador/ranking?${params.toString()}`));
  }

  function handleTorneoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(e.target.value, usuarioInput);
  }

  function handleUsuarioChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsuarioInput(e.target.value);
  }

  function handleUsuarioKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") navigate(currentTorneo, usuarioInput);
  }

  function handleUsuarioBlur() {
    if (usuarioInput !== currentUsuario) navigate(currentTorneo, usuarioInput);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {tournaments.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 shrink-0">Torneo</label>
          <select
            value={currentTorneo}
            onChange={handleTorneoChange}
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
