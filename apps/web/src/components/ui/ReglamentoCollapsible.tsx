"use client";

import { useState } from "react";

type Props = {
  reglamento: { id: string; nombre: string; descripcion: string | null; contenido: string };
};

export function ReglamentoCollapsible({ reglamento }: Props) {
  const [open, setOpen] = useState(false);

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
        <div className="px-4 py-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-white">
          {reglamento.contenido}
        </div>
      )}
    </div>
  );
}
