"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArgentinaGeoSelect } from "@/components/ui/ArgentinaGeoSelect";

type Torneo = {
  id: string;
  name: string;
  status: string;
  format: string;
  adminId: string;
  published: boolean;
  locality: string | null;
  province: string | null;
  startDate: Date | string | null;
  admin: { id: string; name: string };
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
  { value: "", label: "Todos los estados" },
  { value: "REGISTRATION", label: "Inscripción abierta" },
  { value: "IN_PROGRESS",  label: "En curso" },
  { value: "DRAFT",        label: "Borrador" },
  { value: "FINISHED",     label: "Finalizados" },
];

type Props = {
  torneos: Torneo[];
};

export function TorneosFilter({ torneos }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locality, setLocality] = useState("");
  const [province, setProvince] = useState("");
  const [organizerId, setOrganizerId] = useState("");

  const organizers = useMemo(() => {
    const seen = new Set<string>();
    return torneos
      .filter((t) => { if (seen.has(t.admin.id)) return false; seen.add(t.admin.id); return true; })
      .map((t) => ({ id: t.admin.id, name: t.admin.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [torneos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const loc = locality.trim().toLowerCase();
    const prov = province.toLowerCase();

    return torneos.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q)) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (loc && !(t.locality ?? "").toLowerCase().includes(loc)) return false;
      if (prov && !(t.province ?? "").toLowerCase().includes(prov)) return false;
      if (organizerId && t.admin.id !== organizerId) return false;
      return true;
    });
  }, [torneos, search, statusFilter, locality, province, organizerId]);

  return (
    <div className="space-y-5">
      {/* Controles */}
      <div className="flex flex-wrap items-end gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar torneo..."
          className="min-w-[18rem] flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        />

        <div className="min-w-[28rem] flex-1">
          <ArgentinaGeoSelect
            province={province}
            locality={locality}
            onProvinceChange={(value) => setProvince(value)}
            onLocalityChange={(value) => setLocality(value)}
            nameProvince="province"
            nameLocality="locality"
            inline
          />
        </div>

        <select
          value={organizerId}
          onChange={(e) => setOrganizerId(e.target.value)}
          className="min-w-[14rem] px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        >
          <option value="">Todos los organizadores</option>
          {organizers.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>

      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = statusFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-400 text-sm">No se encontraron torneos</p>
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
                  <div className="flex items-center gap-1.5">
                    {t.published && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">Público</span>
                    )}
                    <span className="text-xs text-gray-300">{FORMAT_LABEL[t.format]}</span>
                  </div>
                </div>
                <h2 className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors mb-1 leading-snug">
                  {t.name}
                </h2>
                {(t.locality || t.province) && (
                  <p className="text-xs text-gray-400 mb-3">
                    {[t.locality, t.province].filter(Boolean).join(", ")}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-400 border-t border-gray-50 pt-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t._count.teams} equipos
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
