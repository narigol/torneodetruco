"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Reglamento = {
  id: string;
  nombre: string;
  descripcion: string | null;
  contenido: string;
};

type Props = {
  reglamento?: Reglamento;
};

export function ReglamentoForm({ reglamento }: Props) {
  const router = useRouter();
  const isEditing = !!reglamento;

  const [nombre, setNombre] = useState(reglamento?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(reglamento?.descripcion ?? "");
  const [contenido, setContenido] = useState(reglamento?.contenido ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isEditing ? `/api/reglamentos/${reglamento.id}` : "/api/reglamentos";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        contenido: contenido.trim(),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
      return;
    }

    router.push("/reglamentos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
          placeholder="Ej: Reglamento oficial de truco"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
          placeholder="Resumen breve del reglamento"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Contenido *</label>
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          required
          rows={12}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors resize-y"
          placeholder="Escribí las reglas del torneo aquí..."
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear reglamento"}
        </button>
      </div>
    </form>
  );
}
