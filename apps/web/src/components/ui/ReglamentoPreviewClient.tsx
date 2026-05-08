"use client";

import { useRouter } from "next/navigation";

const SECCION_LABEL: Record<string, string> = {
  GENERAL: "General", FLOR: "Flor", TRUCO: "Truco", ENVIDO: "Envido",
  ANEXO: "Anexo", PENALIDADES: "Penalidades", PUNTAJES: "Puntajes", JERARQUIA: "Jerarquía",
};

type ArticuloPreview = {
  articuloId: string;
  titulo: string;
  seccion: string;
  contenido: string;
};

type Props = {
  reglamento: {
    id: string;
    nombre: string;
    descripcion: string | null;
    adminName: string;
    createdAt: string;
    articulos: ArticuloPreview[];
  };
};

function RenderContenido({ contenido }: { contenido: string }) {
  if (/<[^>]+>/.test(contenido)) {
    return (
      <div
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: contenido }}
      />
    );
  }
  return (
    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{contenido}</p>
  );
}

export function ReglamentoPreviewClient({ reglamento }: Props) {
  const router = useRouter();

  const grouped = reglamento.articulos.reduce<Record<string, ArticuloPreview[]>>((acc, a) => {
    const key = a.seccion;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  const secciones = Object.keys(grouped);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de controles — oculta al imprimir */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
          >
            ← Volver
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-xs">
            {reglamento.nombre}
          </span>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Exportar PDF
        </button>
      </div>

      {/* Documento */}
      <div className="max-w-3xl mx-auto px-8 py-10 print:px-0 print:py-0">

        {/* Portada */}
        <div className="print-cover bg-white rounded-2xl border border-gray-100 p-10 mb-6 text-center print:rounded-none print:border-none print:shadow-none">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mb-4 no-print">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{reglamento.nombre}</h1>
            {reglamento.descripcion && (
              <p className="text-gray-500 text-base mt-2 max-w-md mx-auto">{reglamento.descripcion}</p>
            )}
          </div>
          <div className="border-t border-gray-100 pt-4 text-sm text-gray-400 space-y-0.5">
            <p>Por {reglamento.adminName}</p>
            <p>{new Date(reglamento.createdAt).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p>{reglamento.articulos.length} artículo{reglamento.articulos.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Artículos */}
        {reglamento.articulos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 px-6 py-10 text-center no-print">
            <p className="text-sm text-gray-400">Este reglamento no tiene artículos.</p>
          </div>
        ) : secciones.length > 1 ? (
          // Agrupado por sección si hay más de una
          <div className="space-y-6">
            {secciones.map((seccion) => {
              const arts = grouped[seccion];
              const startIdx = reglamento.articulos.findIndex((a) => a.seccion === seccion);
              return (
                <div key={seccion} className="bg-white rounded-2xl border border-gray-100 overflow-hidden print:rounded-none print:border-none print:shadow-none print-article">
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 print:bg-white">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {SECCION_LABEL[seccion] ?? seccion}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {arts.map((a, i) => (
                      <div key={a.articuloId} className="px-6 py-5 print-article">
                        <h2 className="text-sm font-bold text-gray-900 mb-2">
                          Art. {startIdx + i + 1} — {a.titulo}
                        </h2>
                        <RenderContenido contenido={a.contenido} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Sin agrupación si todos son de la misma sección
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden print:rounded-none print:border-none print:shadow-none">
            <div className="divide-y divide-gray-100">
              {reglamento.articulos.map((a, idx) => (
                <div key={a.articuloId} className="px-6 py-5 print-article">
                  <h2 className="text-sm font-bold text-gray-900 mb-2">
                    Art. {idx + 1} — {a.titulo}
                  </h2>
                  <RenderContenido contenido={a.contenido} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
