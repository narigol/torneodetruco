import { prisma } from "@tdt/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "./PrintButton";

export default async function PublicReglamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const reglamento = await prisma.reglamento.findUnique({
    where: { id, isPublic: true },
    include: {
      admin: { select: { name: true } },
      articulos: {
        where: { visible: true },
        include: { articulo: { select: { id: true, titulo: true, contenido: true } } },
        orderBy: { articulo: { orden: "asc" } },
      },
    },
  });

  if (!reglamento) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between no-print">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Torneos de Truco
          </Link>
          <PrintButton />
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{reglamento.nombre}</h1>
          {reglamento.descripcion && (
            <p className="text-gray-500 text-sm mb-3">{reglamento.descripcion}</p>
          )}
          <p className="text-xs text-gray-400">
            Por {reglamento.admin.name} · {new Date(reglamento.createdAt).toLocaleDateString("es-AR")}
          </p>
        </div>

        {reglamento.articulos.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl px-6 py-10 text-center">
            <p className="text-sm text-gray-400">Este reglamento no tiene artículos.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-100">
              {reglamento.articulos.map((ra, idx) => {
                const contenido = ra.contenidoOverride ?? ra.articulo.contenido;
                return (
                  <div key={ra.articuloId} className="px-6 py-5">
                    <h2 className="text-sm font-semibold text-gray-900 mb-2">
                      Art. {idx + 1} — {ra.articulo.titulo}
                    </h2>
                    {/<[^>]+>/.test(contenido) ? (
                      <div
                        className="prose prose-sm max-w-none text-gray-600"
                        dangerouslySetInnerHTML={{ __html: contenido }}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {contenido}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
