"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";

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

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Auditoria del partido"
        description="Historial de cambios sobre el resultado."
      >
        <div className="space-y-3">
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
      </Sheet>
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
