"use client";

import { useState } from "react";

type Articulo = {
  id: string;
  titulo: string;
  contenido: string;
  mandatory: boolean;
};

type ReglamentoArticulo = {
  articuloId: string;
  visible: boolean;
  contenidoOverride: string | null;
  articulo: Articulo;
};

type Props = {
  reglamento: {
    id: string;
    nombre: string;
    descripcion: string | null;
    articulos: ReglamentoArticulo[];
  };
};

export function ReglamentoCollapsible({ reglamento }: Props) {
  const [open, setOpen] = useState(false);

  const visibles = reglamento.articulos.filter((ra) => ra.visible);

  return (
    <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">{reglamento.nombre}</span>
          {reglamento.descripcion && (
            <span className="text-xs text-gray-400 truncate max-w-xs hidden sm:block">
              — {reglamento.descripcion}
            </span>
          )}
          <span className="text-xs text-gray-400 ml-1">
            ({visibles.length} art.)
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 py-4 bg-white space-y-5">
          {visibles.length === 0 ? (
            <p className="text-sm text-gray-400">Este reglamento no tiene artículos.</p>
          ) : (
            visibles.map((ra, idx) => {
              const contenido = ra.contenidoOverride ?? ra.articulo.contenido;
              return (
                <div key={ra.articuloId}>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Art. {idx + 1} — {ra.articulo.titulo}
                  </h4>
                  {/<[^>]+>/.test(contenido) ? (
                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: contenido }}
                    />
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{contenido}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
