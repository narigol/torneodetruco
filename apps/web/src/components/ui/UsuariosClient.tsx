"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

type Usuario = {
  id: string;
  name: string;
  locality: string | null;
  provincia: string | null;
  role: string;
  plan: string;
  pendingActivation: boolean;
};

type Props = {
  usuarios: Usuario[];
  currentUserId: string;
  contactIds: string[];
};

function RolBadge({ role }: { role: string }) {
  if (role === "ADMIN") return (
    <span className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full font-medium">Super Admin</span>
  );
  if (role === "ORGANIZER") return (
    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">Organizador</span>
  );
  return (
    <span className="text-xs bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-full font-medium">Jugador</span>
  );
}

function EstadoBadge({ pendingActivation }: { pendingActivation: boolean }) {
  if (pendingActivation) return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-yellow-50 text-yellow-700 border border-yellow-100 px-2 py-0.5 rounded-full font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
      Pendiente
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      Activo
    </span>
  );
}

export function UsuariosClient({ usuarios, currentUserId, contactIds }: Props) {
  const [search, setSearch] = useState("");
  const [soloContactos, setSoloContactos] = useState(false);
  const contactSet = new Set(contactIds);

  const filtered = usuarios.filter((u) => {
    if (soloContactos && !contactSet.has(u.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.locality ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o localidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
        />
        {contactIds.length > 0 && (
          <button
            onClick={() => setSoloContactos((v) => !v)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
              soloContactos
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Mis contactos ({contactIds.length})
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No se encontraron usuarios" />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Nombre</th>
                <th className="text-left px-5 py-3 font-medium">Localidad</th>
                <th className="text-left px-5 py-3 font-medium">Rol</th>
                <th className="text-left px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    <Link href={`/usuarios/${u.id}`} className="hover:text-red-600 transition-colors">{u.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {[u.locality, u.provincia].filter(Boolean).join(", ") || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3"><RolBadge role={u.role} /></td>
                  <td className="px-5 py-3"><EstadoBadge pendingActivation={u.pendingActivation} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
