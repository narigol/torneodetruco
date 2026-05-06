"use client";

import { useState } from "react";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  locality: string | null;
  provincia: string | null;
  isRegistered: boolean;
};

type TournamentInfo = {
  name: string;
  startDate: string | null;
  startTime: string | null;
  location: string | null;
  locality: string | null;
  provincia: string | null;
  playersPerTeam: number;
  inscriptionFee: number | null;
  publicUrl: string;
};

type Props = {
  contacts: Contact[];
  tournament: TournamentInfo;
};

const MODALIDAD: Record<number, string> = { 1: "1 vs 1", 2: "2 vs 2", 3: "3 vs 3" };

function buildDefaultTemplate(t: TournamentInfo): string {
  const lines: string[] = [`Hola [nombre]!`, `Te invitamos a participar en *${t.name}*.`, ""];
  const dateStr = t.startDate
    ? new Date(t.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "long" })
    : null;
  if (dateStr || t.startTime) lines.push(`Fecha: ${[dateStr, t.startTime].filter(Boolean).join(" - ")}`);
  const lugar = t.location || [t.locality, t.provincia].filter(Boolean).join(", ");
  if (lugar) lines.push(`Lugar: ${lugar}`);
  const modalidad = MODALIDAD[t.playersPerTeam] ?? `${t.playersPerTeam} vs ${t.playersPerTeam}`;
  lines.push(`Modalidad: ${modalidad}`);
  if (t.inscriptionFee && t.inscriptionFee > 0)
    lines.push(`Inscripcion: $${t.inscriptionFee.toLocaleString("es-AR")}`);
  lines.push("", "Inscribite aca:", t.publicUrl);
  return lines.join("\n");
}

function waInviteLink(phone: string, name: string, template: string) {
  const firstName = name.split(" ")[0];
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  const number = /^54/.test(digits) ? digits : `549${digits}`;
  const text = encodeURIComponent(template.replace(/\[nombre\]/g, firstName));
  return `https://wa.me/${number}?text=${text}`;
}

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ContactosTab({ contacts, tournament }: Props) {
  const [template, setTemplate] = useState(() => buildDefaultTemplate(tournament));
  const [search, setSearch] = useState("");

  const pending = contacts.filter((c) => {
    if (c.isRegistered) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.locality ?? "").toLowerCase().includes(q) ||
      (c.provincia ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Template siempre visible */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <WhatsAppIcon />
            Mensaje de invitación
          </div>
          <button
            onClick={() => setTemplate(buildDefaultTemplate(tournament))}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Restaurar original
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Usá <code className="bg-gray-100 px-1 rounded">[nombre]</code> para insertar el nombre del contacto.
        </p>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={9}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-green-400 resize-y"
        />
      </div>

      {/* Filtro */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, localidad, provincia..."
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
      />

      {/* Lista de contactos por invitar */}
      {pending.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">
          {contacts.filter((c) => !c.isRegistered).length === 0
            ? "No tenés contactos para invitar. Agregá seguidores o contactos manuales."
            : "No hay contactos que coincidan con los filtros."}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {pending.length} contacto{pending.length !== 1 ? "s" : ""} por invitar
          </p>
          {pending.map((c) => (
            <div key={c.id} className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                {(c.locality || c.provincia) && (
                  <p className="text-xs text-gray-400 truncate">{[c.locality, c.provincia].filter(Boolean).join(", ")}</p>
                )}
              </div>

              <div className="flex items-center gap-4 flex-wrap shrink-0">
                {c.phone && (
                  <span className="text-xs text-gray-500">{c.phone}</span>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="text-xs text-blue-500 hover:text-blue-700 transition-colors">
                    {c.email}
                  </a>
                )}
                {c.phone ? (
                  <a
                    href={waInviteLink(c.phone, c.name, template)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    Invitar
                  </a>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-medium rounded-lg cursor-not-allowed"
                    title="Sin número de teléfono"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    Invitar
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
