"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RichTextEditor } from "./RichTextEditor";
import {
  compareArticlesBySectionAndOrder,
  orderSections,
} from "@/lib/reglamento-sections";

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
  return articulos
    .slice()
    .sort(compareArticlesBySectionAndOrder)
    .map((a) => {
      const isAdminArticle = a.admin.role === "ADMIN";
      const existing = reglamento?.articulos.find((ra) => ra.articuloId === a.id);
      return {
        articuloId: a.id,
        titulo: a.titulo,
        seccion: a.seccion,
        contenidoBase: a.contenido,
        mandatory: a.mandatory,
        isAdminArticle,
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

  function setOverride(articuloId: string, html: string) {
    setArticleStates((prev) =>
      prev.map((a) =>
        a.articuloId === articuloId ? { ...a, contenidoOverride: html } : a
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

  const [sectionFilter, setSectionFilter] = useState<string | null>(null);

  const availableSections = orderSections(Array.from(new Set(articleStates.map((a) => a.seccion))));
  const filteredStates = sectionFilter
    ? articleStates.filter((a) => a.seccion === sectionFilter)
    : articleStates;

  const adminArticles = filteredStates.filter((a) => a.isAdminArticle);
  const ownArticles = filteredStates.filter((a) => !a.isAdminArticle);
  const visibleArticles = articleStates.filter((a) => a.visible);

  function renderLeftArticle(a: ArticleState) {
    const canToggle = !a.mandatory && !a.isAdminArticle;
    const isOverridden = a.contenidoOverride !== null;

    return (
      <div key={a.articuloId} className={`px-4 py-3 flex items-start gap-3 ${!a.visible ? "opacity-50" : ""}`}>
        <div className="pt-0.5">
          <input
            type="checkbox"
            checked={a.visible}
            onChange={() => canToggle && toggleVisible(a.articuloId)}
            disabled={!canToggle}
            className="w-4 h-4 rounded accent-red-600 disabled:opacity-60 cursor-pointer disabled:cursor-default"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-snug">{a.titulo}</p>
          <div className="flex flex-wrap gap-1 mt-1">
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
                Editado
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-full">
      {/* Header: campos + botones */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              placeholder="Nombre del reglamento"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
              placeholder="Resumen breve"
            />
          </div>
          {!isAdminUser && (
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded accent-red-600"
                />
                <span className="text-sm text-gray-700 whitespace-nowrap">Público</span>
              </label>
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded-lg">{error}</p>
          )}
          {isEditing && (
            <Link
              href={`/reglamentos/${reglamento.id}/preview`}
              target="_blank"
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </Link>
          )}
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear reglamento"}
          </button>
        </div>
      </div>

      {/* Split-screen */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ height: "calc(100vh - 260px)" }}>
        {/* Panel izquierdo: selección de artículos */}
        <div className="w-72 flex-shrink-0 bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Artículos</p>
              <p className="text-xs text-gray-400">
                {visibleArticles.length} incluido{visibleArticles.length !== 1 ? "s" : ""}
              </p>
            </div>
            {availableSections.length > 1 && (
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSectionFilter(null)}
                  className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                    sectionFilter === null
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
                  }`}
                >
                  Todos
                </button>
                {availableSections.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSectionFilter(sectionFilter === s ? null : s)}
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                      sectionFilter === s
                        ? "bg-red-600 text-white"
                        : "bg-white text-gray-500 border border-gray-200 hover:border-red-300 hover:text-red-600"
                    }`}
                  >
                    {SECCION_LABEL[s] ?? s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {articulos.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">No hay artículos.</p>
                <a href="/reglamentos/articulos" className="text-sm text-red-600 hover:underline mt-1 inline-block">
                  Crear artículos →
                </a>
              </div>
            ) : (
              <>
                {adminArticles.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 bg-blue-50">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Base</p>
                    </div>
                    {adminArticles.map(renderLeftArticle)}
                  </>
                )}
                {ownArticles.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mis artículos</p>
                    </div>
                    {ownArticles.map(renderLeftArticle)}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Panel derecho: preview y editor */}
        <div className="flex-1 bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col">
          {/* Preview header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              {nombre.trim() || <span className="text-gray-300 font-normal">Nombre del reglamento</span>}
            </h2>
            {descripcion.trim() && (
              <p className="text-sm text-gray-500 mt-0.5">{descripcion.trim()}</p>
            )}
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
            {visibleArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
                <div className="text-4xl mb-3 text-gray-200">📋</div>
                <p className="text-sm text-gray-400">
                  Seleccioná artículos en el panel izquierdo para armar el reglamento
                </p>
              </div>
            ) : (
              visibleArticles.map((a, idx) => (
                <div key={a.articuloId} className="px-6 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Art. {idx + 1} — {a.titulo}
                    </h3>
                    <div className="flex items-center gap-2">
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
                      {a.contenidoOverride !== null && (
                        <button
                          type="button"
                          onClick={() => restoreBase(a.articuloId)}
                          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          Restaurar original
                        </button>
                      )}
                    </div>
                  </div>
                  <RichTextEditor
                    content={a.contenidoOverride ?? a.contenidoBase}
                    onChange={(html) => setOverride(a.articuloId, html)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
