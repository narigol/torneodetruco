"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SECCION_LABEL: Record<string, string> = {
  GENERAL: "General", FLOR: "Flor", TRUCO: "Truco", ENVIDO: "Envido",
  ANEXO: "Anexo", PENALIDADES: "Penalidades", PUNTAJES: "Puntajes", JERARQUIA: "Jerarquía",
};

type ArticuloWithAdmin = {
  id: string;
  titulo: string;
  contenido: string;
  seccion: string;
  mandatory: boolean;
  orden: number;
  admin: { id: string; role: string };
};

type ReglamentoArticulo = {
  articuloId: string;
  visible: boolean;
  contenidoOverride: string | null;
};

type Reglamento = {
  id: string;
  nombre: string;
  descripcion: string | null;
  isPublic: boolean;
  articulos: ReglamentoArticulo[];
};

type ArticleState = {
  articuloId: string;
  titulo: string;
  seccion: string;
  contenidoBase: string;
  mandatory: boolean;
  isAdminArticle: boolean;
  visible: boolean;
  contenidoOverride: string | null;
};

type Props = {
  reglamento?: Reglamento;
  articulos: ArticuloWithAdmin[];
  isAdminUser?: boolean;
};

function initArticleStates(articulos: ArticuloWithAdmin[], reglamento?: Reglamento): ArticleState[] {
  return articulos.map((a) => {
    const isAdminArticle = a.admin.role === "ADMIN";
    const existing = reglamento?.articulos.find((ra) => ra.articuloId === a.id);
    return {
      articuloId: a.id,
      titulo: a.titulo,
      seccion: a.seccion,
      contenidoBase: a.contenido,
      mandatory: a.mandatory,
      isAdminArticle,
      // En nuevo reglamento: artículos del admin pre-chequeados; propios según mandatory
      visible: existing ? existing.visible : (isAdminArticle ? true : a.mandatory),
      contenidoOverride: existing?.contenidoOverride ?? null,
    };
  });
}

export function ReglamentoForm({ reglamento, articulos, isAdminUser = false }: Props) {
  const router = useRouter();
  const isEditing = !!reglamento;

  const [nombre, setNombre] = useState(reglamento?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(reglamento?.descripcion ?? "");
  const [isPublic, setIsPublic] = useState(reglamento?.isPublic ?? isAdminUser);
  const [articleStates, setArticleStates] = useState<ArticleState[]>(() =>
    initArticleStates(articulos, reglamento)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleVisible(articuloId: string) {
    setArticleStates((prev) =>
      prev.map((a) =>
        a.articuloId === articuloId && !a.mandatory && !a.isAdminArticle
          ? { ...a, visible: !a.visible, contenidoOverride: a.visible ? null : a.contenidoOverride }
          : a
      )
    );
  }

  function setOverride(articuloId: string, value: string) {
    setArticleStates((prev) =>
      prev.map((a) =>
        a.articuloId === articuloId
          ? { ...a, contenidoOverride: value === a.contenidoBase ? null : value }
          : a
      )
    );
  }

  function restoreBase(articuloId: string) {
    setArticleStates((prev) =>
      prev.map((a) =>
        a.articuloId === articuloId ? { ...a, contenidoOverride: null } : a
      )
    );
  }

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
        isPublic,
        articles: articleStates.map((a) => ({
          articuloId: a.articuloId,
          visible: a.visible,
          contenidoOverride: a.contenidoOverride,
        })),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al guardar");
      return;
    }

    router.push("/reglamentos");
    router.refresh();
  }

  const adminArticles = articleStates.filter((a) => a.isAdminArticle);
  const ownArticles = articleStates.filter((a) => !a.isAdminArticle);
  const visibleCount = articleStates.filter((a) => a.visible).length;

  function renderArticle(a: ArticleState) {
    const currentContent = a.contenidoOverride ?? a.contenidoBase;
    const isOverridden = a.contenidoOverride !== null;
    const isReadOnly = a.mandatory || a.isAdminArticle;
    const canToggle = !a.mandatory && !a.isAdminArticle;

    return (
      <div key={a.articuloId} className={`px-5 py-4 ${!a.visible ? "opacity-50" : ""}`}>
        <div className="flex items-start gap-3">
          <div className="pt-0.5">
            <input
              type="checkbox"
              checked={a.visible}
              onChange={() => canToggle && toggleVisible(a.articuloId)}
              disabled={!canToggle}
              className="w-4 h-4 rounded accent-red-600 disabled:opacity-60"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-sm font-semibold text-gray-900">{a.titulo}</span>
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                {SECCION_LABEL[a.seccion] ?? a.seccion}
              </span>
              {a.mandatory && (
                <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-full font-medium">
                  Obligatorio
                </span>
              )}
              {a.isAdminArticle && (
                <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-medium">
                  Base
                </span>
              )}
              {isOverridden && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full">
                  Personalizado
                </span>
              )}
            </div>

            {a.visible && (
              isReadOnly ? (
                <p className="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg px-3 py-2">
                  {a.contenidoBase}
                </p>
              ) : (
                <div>
                  <textarea
                    value={currentContent}
                    onChange={(e) => setOverride(a.articuloId, e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y"
                  />
                  {isOverridden && (
                    <button
                      type="button"
                      onClick={() => restoreBase(a.articuloId)}
                      className="mt-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      Restaurar original
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
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

        {!isAdminUser && (
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="is-public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded accent-red-600"
            />
            <div>
              <label htmlFor="is-public" className="text-sm font-medium text-gray-700">
                Reglamento público
              </label>
              <p className="text-xs text-gray-400">
                Cualquier persona puede verlo con el link, sin necesidad de cuenta
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Artículos */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Artículos</h2>
            <p className="text-xs text-gray-400 mt-0.5">{visibleCount} incluido{visibleCount !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {articulos.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">No hay artículos disponibles.</p>
            <a href="/reglamentos/articulos" className="text-sm text-red-600 hover:underline mt-1 inline-block">
              Crear artículos →
            </a>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {adminArticles.length > 0 && (
              <>
                <div className="px-5 py-2 bg-blue-50">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Artículos base (reglamento oficial)
                  </p>
                </div>
                {adminArticles.map(renderArticle)}
              </>
            )}
            {ownArticles.length > 0 && (
              <>
                {adminArticles.length > 0 && (
                  <div className="px-5 py-2 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Mis artículos
                    </p>
                  </div>
                )}
                {ownArticles.map(renderArticle)}
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3">
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
