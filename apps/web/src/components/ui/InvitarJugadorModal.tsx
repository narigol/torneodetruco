"use client";

import { useState, useEffect, useRef } from "react";

type Usuario = {
  id: string;
  name: string;
  email: string;
  locality: string | null;
  province: string | null;
};

type InvitedUser = { userId: string; status: string };

type Props = {
  tournamentId: string;
  alreadyInvited: InvitedUser[];
  currentUserId: string;
};

export function InvitarJugadorModal({ tournamentId, alreadyInvited, currentUserId }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invited, setInvited] = useState<Set<string>>(
    new Set(alreadyInvited.map((i) => i.userId))
  );
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/usuarios?search=${encodeURIComponent(search.trim())}&limit=10`);
      setLoading(false);
      if (res.ok) setResults((await res.json()).filter((u: Usuario) => u.id !== currentUserId));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  async function handleInvite(userId: string) {
    setInviting(userId);
    setError("");
    const res = await fetch(`/api/torneos/${tournamentId}/invitaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setInviting(null);
    if (res.ok) {
      setInvited((prev) => new Set([...prev, userId]));
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al invitar");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Invitar jugadores
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Invitar jugador</h2>
          <button
            onClick={() => { setOpen(false); setSearch(""); setResults([]); setError(""); }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          placeholder="Buscar por nombre, email o localidad..."
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors mb-3"
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>
        )}

        {loading && (
          <p className="text-sm text-gray-400 text-center py-4">Buscando...</p>
        )}

        {!loading && search.trim() && results.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No se encontraron usuarios</p>
        )}

        {!loading && results.length > 0 && (
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl max-h-64 overflow-y-auto">
            {results.map((u) => {
              const isInvited = invited.has(u.id);
              return (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {[u.locality, u.province].filter(Boolean).join(", ") || u.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleInvite(u.id)}
                    disabled={isInvited || inviting === u.id}
                    className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isInvited
                        ? "bg-gray-100 text-gray-400 cursor-default"
                        : "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                    }`}
                  >
                    {isInvited ? "Invitado" : inviting === u.id ? "..." : "Invitar"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
