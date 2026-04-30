"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Admin = { id: string; name: string };
type Torneo = { id: string; name: string };

type Reglamento = {
  id: string;
  nombre: string;
  descripcion: string | null;
  contenido: string;
  createdAt: string | Date;
  admin: Admin;
  torneos: Torneo[];
};

type Props = {
  reglamentos: Reglamento[];
  currentUserId: string;
  isAdmin: boolean;
};

export function ReglamentosClient({ reglamentos, currentUserId, isAdmin }: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function handleDelete(id: string) {
    await fetch(`/api/reglamentos/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    router.refresh();
  }

  if (reglamentos.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg mb-1">No hay reglamentos</p>
        <p className="text-sm">Creá el primero desde el botón de arriba.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reglamentos.map((r) => {
        const canEdit = isAdmin || r.admin.id === currentUserId;
        const isExpanded = expanded === r.id;

        return (
          <div key={r.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-start gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-gray-900 text-sm">{r.nombre}</h3>
                  {r.torneos.length > 0 && (
                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                      {r.torneos.length} torneo{r.torneos.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {r.descripcion && (
                  <p className="text-sm text-gray-500 line-clamp-1">{r.descripcion}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Por {r.admin.name} · {new Date(r.createdAt).toLocaleDateString("es-AR")}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {isExpanded ? "Ocultar" : "Ver"}
                </button>
                {canEdit && (
                  <>
                    <Link
                      href={`/reglamentos/${r.id}/editar`}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      Editar
                    </Link>
                    {confirmDelete === r.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-gray-500">¿Eliminar?</span>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(r.id)}
                        className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {r.contenido}
                </p>
                {r.torneos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-400 mb-1">Usado en:</p>
                    <div className="flex flex-wrap gap-1">
                      {r.torneos.map((t) => (
                        <Link
                          key={t.id}
                          href={`/torneos/${t.id}`}
                          className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded hover:border-red-300 hover:text-red-600 transition-colors"
                        >
                          {t.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
