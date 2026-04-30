"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { PROVINCIAS } from "@/lib/argentina";
import { DeleteButton } from "@/components/ui/DeleteButton";

type Jugador = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  locality: string | null;
  provincia: string | null;
  teamPlayers: { team: { name: string; tournament: { name: string } } }[];
};

type Props = {
  jugadores: Jugador[];
  isAdmin: boolean;
};

export function JugadoresFilter({ jugadores, isAdmin }: Props) {
  const [search, setSearch] = useState("");
  const [provinciaFilter, setProvinciaFilter] = useState("");
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const terms = deferredSearch.trim().toLocaleLowerCase("es-AR").split(/\s+/).filter(Boolean);
    return jugadores.filter((j) => {
      if (provinciaFilter && j.provincia !== provinciaFilter) return false;
      if (terms.length > 0) {
        const name = j.name.toLocaleLowerCase("es-AR");
        if (!terms.every((t) => name.includes(t))) return false;
      }
      return true;
    });
  }, [jugadores, deferredSearch, provinciaFilter]);

  const hasFilters = search.trim() || provinciaFilter;

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        />
        <select
          value={provinciaFilter}
          onChange={(e) => setProvinciaFilter(e.target.value)}
          className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        >
          <option value="">Todas las provincias</option>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No se encontraron jugadores</p>
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setProvinciaFilter(""); }}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 text-xs text-gray-400">
            {filtered.length} de {jugadores.length} jugador{jugadores.length !== 1 ? "es" : ""}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Nombre</th>
                <th className="text-left px-5 py-3 font-medium">Provincia</th>
                <th className="text-left px-5 py-3 font-medium">Localidad</th>
                <th className="text-left px-5 py-3 font-medium">Teléfono</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Equipos</th>
                {isAdmin && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{j.name}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {j.provincia ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {j.locality ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {j.phone ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {j.email ? (
                      <a href={`mailto:${j.email}`} className="hover:text-red-600 transition-colors">
                        {j.email}
                      </a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {j.teamPlayers.length === 0 ? (
                      <span className="text-gray-300">Sin equipo</span>
                    ) : (
                      j.teamPlayers.map((tp) => `${tp.team.name} (${tp.team.tournament.name})`).join(", ")
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/jugadores/${j.id}/editar`} className="text-xs text-gray-400 hover:text-gray-700">
                          Editar
                        </Link>
                        <DeleteButton
                          url={`/api/jugadores/${j.id}`}
                          label="Eliminar"
                          confirmText={`¿Eliminar a ${j.name}?`}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
