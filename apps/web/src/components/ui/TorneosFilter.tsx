"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Torneo = {
  id: string;
  name: string;
  status: string;
  format: string;
  adminId: string;
  admin: { name: string };
  _count: { teams: number; matches: number };
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  DRAFT:        { label: "Borrador",    dot: "bg-gray-300",  text: "text-gray-500" },
  REGISTRATION: { label: "Inscripción", dot: "bg-blue-400",  text: "text-blue-600" },
  IN_PROGRESS:  { label: "En curso",    dot: "bg-green-400", text: "text-green-600" },
  FINISHED:     { label: "Finalizado",  dot: "bg-gray-300",  text: "text-gray-400" },
};

const FORMAT_LABEL: Record<string, string> = {
  GROUPS_AND_KNOCKOUT: "Grupos + Eliminatoria",
  SINGLE_ELIMINATION:  "Eliminación directa",
};

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "REGISTRATION", label: "Inscripción" },
  { value: "IN_PROGRESS",  label: "En curso" },
  { value: "DRAFT",        label: "Borrador" },
  { value: "FINISHED",     label: "Finalizado" },
];

type Props = {
  torneos: Torneo[];
  userId?: string;
  isAdmin: boolean;
};

export function TorneosFilter({ torneos, userId, isAdmin }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mineOnly, setMineOnly] = useState(false);

  const filtered = useMemo(() => {
    return torneos.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (mineOnly && userId && t.adminId !== userId) return false;
      return true;
    });
  }, [torneos, search, statusFilter, mineOnly, userId]);

  return (
    <div className="space-y-5">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar torneo..."
          className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        {userId && !isAdmin && (
          <button
            onClick={() => setMineOnly((v) => !v)}
            className={`px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              mineOnly
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Mis torneos
          </button>
        )}
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-400 text-sm">No se encontraron torneos</p>
          {(search || statusFilter || mineOnly) && (
            <button
              onClick={() => { setSearch(""); setStatusFilter(""); setMineOnly(false); }}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => {
            const sc = STATUS_CONFIG[t.status];
            return (
              <Link
                key={t.id}
                href={`/torneos/${t.id}`}
                className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </div>
                  <span className="text-xs text-gray-300">{FORMAT_LABEL[t.format]}</span>
                </div>
                <h2 className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors mb-4 leading-snug">
                  {t.name}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-400 border-t border-gray-50 pt-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t._count.teams} equipos
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t._count.matches} partidos
                  </span>
                  <span className="ml-auto text-xs truncate">{t.admin.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
