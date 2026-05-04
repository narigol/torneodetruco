"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Player = {
  id: string;
  name: string;
  email: string | null;
  dni: string | null;
  phone: string | null;
  locality: string | null;
  provincia: string | null;
};

type Props = {
  teamId: string;
  teamName: string;
  players: Player[];
  canDelete?: boolean;
};

function DataRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-400 shrink-0 w-14 text-xs pt-0.5">{label}</span>
      <span className="text-gray-800 break-all">{value}</span>
    </div>
  );
}

export function EquipoDetailModal({ teamId, teamName, players, canDelete }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/equipos/${teamId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left hover:bg-gray-50 transition-colors rounded-xl px-4 py-3.5 border border-gray-100 bg-white hover:border-gray-200"
      >
        <p className="font-semibold text-gray-900 text-sm">{teamName}</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          {players.map((p) => p.name).join(" · ")}
        </p>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{teamName}</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {players.map((player, idx) => (
                <div key={player.id}>
                  {players.length > 1 && (
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Jugador {idx + 1}
                    </p>
                  )}
                  <div className="space-y-1.5">
                    <p className="font-medium text-gray-900">{player.name}</p>
                    <DataRow label="DNI" value={player.dni} />
                    <DataRow label="Email" value={player.email} />
                    <DataRow label="Tel" value={player.phone} />
                    <DataRow
                      label="Zona"
                      value={[player.locality, player.provincia].filter(Boolean).join(", ") || null}
                    />
                  </div>
                  {idx < players.length - 1 && <div className="mt-4 border-t border-gray-100" />}
                </div>
              ))}
            </div>

            {canDelete && (
              <div className="px-6 pb-6">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {deleting ? "Eliminando..." : "Eliminar equipo"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
