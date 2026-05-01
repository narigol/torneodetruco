"use client";

import { useState } from "react";

type AuditItem = {
  id: string;
  action: string;
  createdAt: string;
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  user: {
    name: string;
    email: string;
  };
};

export function MatchAuditModal({ matchId }: { matchId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AuditItem[]>([]);
  const [error, setError] = useState("");

  async function openModal() {
    setOpen(true);
    setLoading(true);
    setError("");
    const res = await fetch(`/api/partidos/${matchId}/auditoria`);
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo cargar la auditoria.");
      return;
    }
    setItems(await res.json());
  }

  return (
    <>
      <button
        onClick={openModal}
        className="text-xs text-gray-500 hover:text-red-600 font-medium whitespace-nowrap"
      >
        Auditoria
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Auditoria del partido</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Historial de cambios sobre el resultado.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {loading && <p className="text-sm text-gray-400">Cargando...</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {!loading && !error && items.length === 0 && (
                <p className="text-sm text-gray-400">Todavia no hay eventos registrados.</p>
              )}
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.action}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {item.user.name} · {new Date(item.createdAt).toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <AuditBlock title="Antes" data={item.previousData} />
                    <AuditBlock title="Despues" data={item.newData} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AuditBlock({
  title,
  data,
}: {
  title: string;
  data: Record<string, unknown> | null;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>
      <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-600">
        {data ? JSON.stringify(data, null, 2) : "Sin datos"}
      </pre>
    </div>
  );
}
