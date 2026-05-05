"use client";

import { useState } from "react";

type Player = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type Team = {
  id: string;
  name: string;
  players: Player[];
};

type TournamentInfo = {
  name: string;
  startDate: string | null;
  startTime: string | null;
  location: string | null;
  locality: string | null;
  province: string | null;
  playersPerTeam: number;
  inscriptionFee: number | null;
  publicUrl: string;
};

type Props = {
  teams: Team[];
  tournament: TournamentInfo;
};

const MODALIDAD: Record<number, string> = { 1: "1 vs 1", 2: "2 vs 2", 3: "3 vs 3" };


function buildDefaultTemplate(t: TournamentInfo): string {
  const lines: string[] = [`Hola [nombre]! 👋`, `Te invitamos a participar en *${t.name}*.`, ""];
  const dateStr = t.startDate
    ? new Date(t.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "long" })
    : null;
  if (dateStr || t.startTime) lines.push(`📅 ${[dateStr, t.startTime].filter(Boolean).join(" · ")}`);
  const lugar = t.location || [t.locality, t.province].filter(Boolean).join(", ");
  if (lugar) lines.push(`📍 ${lugar}`);
  const modalidad = MODALIDAD[t.playersPerTeam] ?? `${t.playersPerTeam} vs ${t.playersPerTeam}`;
  lines.push(`👥 Modalidad: ${modalidad}`);
  if (t.inscriptionFee && t.inscriptionFee > 0)
    lines.push(`💰 Inscripción: $${t.inscriptionFee.toLocaleString("es-AR")}`);
  lines.push("", "Inscribite acá:", t.publicUrl);
  return lines.join("\n");
}

function waInviteLink(phone: string, playerName: string, template: string) {
  const firstName = playerName.split(" ")[0];
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  const number = /^54/.test(digits) ? digits : `549${digits}`;
  const text = encodeURIComponent(template.replace(/\[nombre\]/g, firstName));
  return `https://wa.me/${number}?text=${text}`;
}

function WhatsAppIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      title="Copiar"
    >
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

export function ContactosTab({ teams, tournament }: Props) {
  const [template, setTemplate] = useState(() => buildDefaultTemplate(tournament));
  const [showTemplate, setShowTemplate] = useState(false);

  const allPlayers = teams.flatMap((t) => t.players.map((p) => ({ ...p, teamName: t.name })));
  const allPhones = allPlayers.filter((p) => p.phone).map((p) => p.phone!).join("\n");
  const allEmails = allPlayers.filter((p) => p.email).map((p) => p.email!).join("\n");
  const withoutContact = allPlayers.filter((p) => !p.phone && !p.email);

  return (
    <div className="space-y-6">
      {/* Mensaje de WhatsApp */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowTemplate((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <WhatsAppIcon />
            Mensaje de invitación
          </span>
          <span className="text-xs text-gray-400">{showTemplate ? "Cerrar" : "Editar"}</span>
        </button>
        {showTemplate && (
          <div className="px-5 pb-4 space-y-2 border-t border-gray-50">
            <p className="text-xs text-gray-400 pt-3">Usá <code className="bg-gray-100 px-1 rounded">[nombre]</code> para insertar el nombre del jugador.</p>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={10}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-green-400 resize-y"
            />
            <button
              onClick={() => setTemplate(buildDefaultTemplate(tournament))}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Restaurar mensaje original
            </button>
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="flex flex-wrap gap-3">
        {allPhones && (
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm">
            <span className="text-gray-500">{allPlayers.filter((p) => p.phone).length} teléfonos</span>
            <CopyButton text={allPhones} />
          </div>
        )}
        {allEmails && (
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm">
            <span className="text-gray-500">{allPlayers.filter((p) => p.email).length} emails</span>
            <CopyButton text={allEmails} />
          </div>
        )}
        {withoutContact.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-sm text-amber-700">
            {withoutContact.length} jugador{withoutContact.length !== 1 ? "es" : ""} sin datos de contacto
          </div>
        )}
      </div>

      {/* Por equipo */}
      <div className="space-y-4">
        {teams.map((team) => (
          <div key={team.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/60">
              <p className="text-sm font-semibold text-gray-800">{team.name}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {team.players.map((player) => (
                <div key={player.id} className="flex items-center gap-4 px-5 py-3">
                  <p className="text-sm font-medium text-gray-900 w-40 shrink-0 truncate">{player.name}</p>

                  <div className="flex items-center gap-3 flex-1 flex-wrap">
                    {player.phone ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={waInviteLink(player.phone, player.name, template)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Enviar invitación por WhatsApp"
                          className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
                        >
                          <WhatsAppIcon />
                          {player.phone}
                        </a>
                        <CopyButton text={player.phone} />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">Sin teléfono</span>
                    )}

                    {player.email ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${player.email}`}
                          className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          {player.email}
                        </a>
                        <CopyButton text={player.email} />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">Sin email</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {teams.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">No hay equipos inscriptos aún.</p>
        )}
      </div>
    </div>
  );
}
