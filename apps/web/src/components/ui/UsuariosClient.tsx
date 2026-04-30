"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TeamPlayer = { team: { name: string; tournament: { name: string } } };
type Player = { id: string; confirmed: boolean; teamPlayers: TeamPlayer[] } | null;

type Usuario = {
  id: string;
  name: string;
  email: string;
  dni: string | null;
  phone: string | null;
  locality: string | null;
  province: string | null;
  role: string;
  plan: string;
  pendingActivation: boolean;
  createdAt: Date;
  player: Player;
};

type Props = {
  usuarios: Usuario[];
  isAdmin: boolean;
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

export function UsuariosClient({ usuarios, isAdmin }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const filtered = usuarios.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.dni ?? "").includes(q) ||
      (u.locality ?? "").toLowerCase().includes(q)
    );
  });

  async function handleDelete(id: string) {
    await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    router.refresh();
  }

  async function handleRoleChange(id: string, newRole: "ORGANIZER" | "PLAYER") {
    setChangingRole(id);
    await fetch(`/api/usuarios/${id}/rol`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setChangingRole(null);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, email, DNI o localidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Nombre</th>
                <th className="text-left px-5 py-3 font-medium">DNI</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Localidad</th>
                <th className="text-left px-5 py-3 font-medium">Rol</th>
                <th className="text-left px-5 py-3 font-medium">Estado</th>
                <th className="text-left px-5 py-3 font-medium">Equipos</th>
                {isAdmin && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-500">{u.dni ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {u.email ? (
                      <a href={`mailto:${u.email}`} className="hover:text-red-600 transition-colors">{u.email}</a>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {[u.locality, u.province].filter(Boolean).join(", ") || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3"><RolBadge role={u.role} /></td>
                  <td className="px-5 py-3"><EstadoBadge pendingActivation={u.pendingActivation} /></td>
                  <td className="px-5 py-3 text-gray-500">
                    {u.player?.teamPlayers.length === 0 || !u.player ? (
                      <span className="text-gray-300">Sin equipo</span>
                    ) : (
                      u.player.teamPlayers.map((tp) => `${tp.team.name} (${tp.team.tournament.name})`).join(", ")
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/usuarios/${u.id}/editar`} className="text-xs text-gray-400 hover:text-gray-700">
                          Editar
                        </Link>
                        {u.role !== "ADMIN" && (
                          <button
                            onClick={() => handleRoleChange(u.id, u.role === "ORGANIZER" ? "PLAYER" : "ORGANIZER")}
                            disabled={changingRole === u.id}
                            className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
                          >
                            {changingRole === u.id ? "..." : u.role === "ORGANIZER" ? "Quitar organizador" : "Hacer organizador"}
                          </button>
                        )}
                        {u.role !== "ADMIN" && (
                          confirmDelete === u.id ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="text-xs text-gray-500">¿Eliminar a {u.name}?</span>
                              <button onClick={() => handleDelete(u.id)} className="text-xs text-red-600 hover:underline">Confirmar</button>
                              <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmDelete(u.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">
                              Eliminar
                            </button>
                          )
                        )}
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
