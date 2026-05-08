"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

type Admin = { id: string; name: string };
type Torneo = { id: string; name: string };
type ArticuloItem = { visible: boolean };

type Reglamento = {
  id: string;
  nombre: string;
  descripcion: string | null;
  isPublic: boolean;
  createdAt: string | Date;
  admin: Admin;
  torneos: Torneo[];
  articulos: ArticuloItem[];
};

type Props = {
  reglamentos: Reglamento[];
  currentUserId: string;
  isAdmin: boolean;
  readOnly?: boolean;
};

export function ReglamentosClient({ reglamentos, currentUserId, isAdmin, readOnly = false }: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function handleTogglePublic(id: string, current: boolean) {
    await fetch(`/api/reglamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !current }),
    });
    router.refresh();
  }

  function handleCopyLink(id: string) {
    const url = `${window.location.origin}/r/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/reglamentos/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    router.refresh();
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? reglamentos.filter(
        (r) =>
          r.nombre.toLowerCase().includes(q) ||
          r.admin.name.toLowerCase().includes(q)
      )
    : reglamentos;

  if (reglamentos.length === 0) {
    return (
      <EmptyState
        message="No hay reglamentos"
        submessage={readOnly ? "No hay reglamentos publicados." : "Creá el primero desde el botón de arriba."}
      />
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Buscar por reglamento u organizador..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      {filtered.length === 0 && (
        <EmptyState message="Sin resultados" submessage="No hay reglamentos que coincidan con la búsqueda." />
      )}
      {filtered.map((r) => {
        const canEdit = !readOnly && (isAdmin || r.admin.id === currentUserId);
        const visibleCount = r.articulos.filter((a) => a.visible).length;

        return (
          <div key={r.id} className="bg-white border border-gray-100 rounded-xl">
            <div className="flex items-start gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-sm">{r.nombre}</h3>
                  {r.torneos.length > 0 && (
                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                      {r.torneos.length} torneo{r.torneos.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {visibleCount} art.
                  </span>
                </div>
                {r.descripcion && (
                  <p className="text-sm text-gray-500 line-clamp-1">{r.descripcion}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Por {r.admin.name} · {new Date(r.createdAt).toLocaleDateString("es-AR")}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                {r.isPublic && (
                  <button
                    onClick={() => handleCopyLink(r.id)}
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {copied === r.id ? "¡Copiado!" : "Copiar link"}
                  </button>
                )}
                {(r.isPublic || canEdit) && (
                  <Link
                    href={`/reglamentos/${r.id}/preview`}
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Ver
                  </Link>
                )}
                {canEdit && (
                  <>
                    <button
                      onClick={() => handleTogglePublic(r.id, r.isPublic)}
                      className={`text-xs transition-colors ${
                        r.isPublic
                          ? "text-green-600 hover:text-gray-500"
                          : "text-gray-400 hover:text-green-600"
                      }`}
                    >
                      {r.isPublic ? "Público ✓" : "Hacer público"}
                    </button>
                    <Link href={`/reglamentos/${r.id}/editar`} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
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

            {r.torneos.length > 0 && (
              <div className="px-5 pb-4 flex flex-wrap gap-1">
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
            )}
          </div>
        );
      })}
    </div>
  );
}
