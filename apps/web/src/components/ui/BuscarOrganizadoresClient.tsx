"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FollowButton } from "@/components/ui/FollowButton";
import { PROVINCIAS } from "@/lib/argentina";

type Organizador = {
  id: string;
  name: string;
  locality: string | null;
  province: string | null;
  role: string;
};

type Props = {
  organizadores: Organizador[];
  currentUserId: string;
};

function roleLabel(role: string) {
  if (role === "ADMIN") return "Super Admin";
  return "Organizador";
}

export function BuscarOrganizadoresClient({ organizadores, currentUserId }: Props) {
  const [search, setSearch] = useState("");
  const [provincia, setProvincia] = useState("");
  const [localidad, setLocalidad] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const loc = localidad.trim().toLowerCase();
    return organizadores.filter((o) => {
      if (q && !o.name.toLowerCase().includes(q)) return false;
      if (provincia && o.province !== provincia) return false;
      if (loc && !(o.locality ?? "").toLowerCase().includes(loc)) return false;
      return true;
    });
  }, [organizadores, search, provincia, localidad]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        />
        <select
          value={provincia}
          onChange={(e) => { setProvincia(e.target.value); setLocalidad(""); }}
          className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        >
          <option value="">Todas las provincias</option>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="text"
          value={localidad}
          onChange={(e) => setLocalidad(e.target.value)}
          placeholder="Localidad..."
          className="w-44 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl px-5 py-6 text-center">
          No se encontraron organizadores con esos filtros.
        </p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
          {filtered.map((o) => {
            const initials = o.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <span className="text-red-700 text-xs font-bold">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/usuarios/${o.id}`} className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors">
                    {o.name}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {roleLabel(o.role)}
                    {(o.locality || o.province) && ` · ${[o.locality, o.province].filter(Boolean).join(", ")}`}
                  </p>
                </div>
                {o.id !== currentUserId && (
                  <FollowButton organizerId={o.id} organizerName={o.name} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-right">{filtered.length} de {organizadores.length} organizadores</p>
    </div>
  );
}
