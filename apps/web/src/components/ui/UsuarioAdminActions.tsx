"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  userId: string;
  userName: string;
  userRole: string;
};

export function UsuarioAdminActions({ userId, userName, userRole }: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [changingRole, setChangingRole] = useState(false);

  async function handleRoleChange() {
    setChangingRole(true);
    const newRole = userRole === "ORGANIZER" ? "PLAYER" : "ORGANIZER";
    await fetch(`/api/usuarios/${userId}/rol`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setChangingRole(false);
    router.refresh();
  }

  async function handleDelete() {
    await fetch(`/api/usuarios/${userId}`, { method: "DELETE" });
    router.push("/usuarios");
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Administración</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/usuarios/${userId}/editar`}
          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Editar datos
        </Link>

        {userRole !== "ADMIN" && (
          <button
            onClick={handleRoleChange}
            disabled={changingRole}
            className="px-4 py-2 border border-blue-200 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {changingRole ? "..." : userRole === "ORGANIZER" ? "Quitar organizador" : "Hacer organizador"}
          </button>
        )}

        {userRole !== "ADMIN" && (
          confirmDelete ? (
            <span className="inline-flex items-center gap-2">
              <span className="text-sm text-gray-500">¿Eliminar a {userName}?</span>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
                Confirmar
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 border border-red-100 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Eliminar usuario
            </button>
          )
        )}
      </div>
    </div>
  );
}
