"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SECCIONES = ["GENERAL","FLOR","TRUCO","ENVIDO","ANEXO","PENALIDADES","PUNTAJES","JERARQUIA"] as const;
type Seccion = typeof SECCIONES[number];

const SECCION_LABEL: Record<Seccion, string> = {
  GENERAL: "General",
  FLOR: "Flor",
  TRUCO: "Truco",
  ENVIDO: "Envido",
  ANEXO: "Anexo",
  PENALIDADES: "Penalidades",
  PUNTAJES: "Puntajes",
  JERARQUIA: "Jerarquía",
};

type Articulo = {
  id: string;
  titulo: string;
  contenido: string;
  seccion: Seccion;
  mandatory: boolean;
  orden: number;
};

type Props = {
  articulos: Articulo[];
};

function ArticuloForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Articulo;
  onSave: (data: { titulo: string; contenido: string; seccion: Seccion; mandatory: boolean; orden: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [contenido, setContenido] = useState(initial?.contenido ?? "");
  const [seccion, setSeccion] = useState<Seccion>(initial?.seccion ?? "GENERAL");
  const [mandatory, setMandatory] = useState(initial?.mandatory ?? false);
  const [orden, setOrden] = useState(String(initial?.orden ?? 0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) {
      setError("Título y contenido son requeridos");
      return;
    }
    setError("");
    setLoading(true);
    await onSave({ titulo: titulo.trim(), contenido: contenido.trim(), seccion, mandatory, orden: parseInt(orden, 10) || 0 });
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Título *</label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Ej: Modalidad de juego"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Sección</label>
        <select
          value={seccion}
          onChange={(e) => setSeccion(e.target.value as Seccion)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
        >
          {SECCIONES.map((s) => (
            <option key={s} value={s}>{SECCION_LABEL[s]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Contenido *</label>
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y"
          placeholder="Texto del artículo..."
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="mandatory-check"
            checked={mandatory}
            onChange={(e) => setMandatory(e.target.checked)}
            className="w-4 h-4 rounded accent-red-600"
          />
          <label htmlFor="mandatory-check" className="text-sm text-gray-700">Obligatorio</label>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Orden</label>
          <input
            type="text"
            inputMode="numeric"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : initial ? "Guardar" : "Crear"}
        </button>
      </div>
    </form>
  );
}

export function ArticulosClient({ articulos: initial }: Props) {
  const router = useRouter();
  const [articulos, setArticulos] = useState(initial);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function handleCreate(data: { titulo: string; contenido: string; seccion: Seccion; mandatory: boolean; orden: number }) {
    const res = await fetch("/api/articulos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const nuevo = await res.json();
      setArticulos((prev) => [...prev, nuevo].sort((a, b) => a.orden - b.orden));
      setShowNew(false);
    }
  }

  async function handleEdit(id: string, data: { titulo: string; contenido: string; seccion: Seccion; mandatory: boolean; orden: number }) {
    const res = await fetch(`/api/articulos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setArticulos((prev) =>
        prev.map((a) => (a.id === id ? updated : a)).sort((a, b) => a.orden - b.orden)
      );
      setEditing(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/articulos/${id}`, { method: "DELETE" });
    setDeleting(null);
    setConfirmDelete(null);
    setArticulos((prev) => prev.filter((a) => a.id !== id));
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {articulos.length} artículo{articulos.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowNew(true)}
          className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
        >
          + Nuevo artículo
        </button>
      </div>

      {articulos.length === 0 && !showNew && (
        <p className="text-sm text-gray-400 text-center py-8">
          Todavía no hay artículos. Creá el primero.
        </p>
      )}

      <div className="space-y-3">
        {showNew && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Nuevo artículo</h3>
            <ArticuloForm
              onSave={handleCreate}
              onCancel={() => setShowNew(false)}
            />
          </div>
        )}

        {articulos.map((a) => (
          <div key={a.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {editing === a.id ? (
              <div className="p-4">
                <ArticuloForm
                  initial={a}
                  onSave={(data) => handleEdit(a.id, data)}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-mono">#{a.orden}</span>
                      <h3 className="text-sm font-semibold text-gray-900">{a.titulo}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        {SECCION_LABEL[a.seccion]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.mandatory
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {a.mandatory ? "Obligatorio" : "Opcional"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.contenido}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setEditing(a.id)}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      Editar
                    </button>
                    {confirmDelete === a.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deleting === a.id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deleting === a.id ? "..." : "Confirmar"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(a.id)}
                        className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
