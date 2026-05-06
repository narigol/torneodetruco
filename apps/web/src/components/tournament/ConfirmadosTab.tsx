"use client";

import { downloadXlsx } from "@/lib/xlsx";

type Player = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type Team = {
  id: string;
  name: string;
  hasPaid: boolean;
  players: Player[];
};

type Props = {
  teams: Team[];
  hasFee: boolean;
};

function WhatsAppIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  const number = /^54/.test(digits) ? digits : `549${digits}`;
  return `https://wa.me/${number}`;
}

function exportXlsx(teams: Team[]) {
  downloadXlsx(
    teams.flatMap((team) =>
      team.players.map((p) => ({
        Equipo: team.name,
        Jugador: p.name,
        Teléfono: p.phone ?? "",
        Email: p.email ?? "",
      }))
    ),
    "confirmados.xlsx",
    "Confirmados"
  );
}

export function ConfirmadosTab({ teams, hasFee }: Props) {
  const allPlayers = teams.flatMap((t) => t.players).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {teams.length} equipo{teams.length !== 1 ? "s" : ""} · {allPlayers} jugador{allPlayers !== 1 ? "es" : ""}
        </p>
        <button
          onClick={() => exportXlsx(teams)}
          disabled={teams.length === 0}
          className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar .xlsx
        </button>
      </div>

      {teams.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">No hay equipos confirmados aún.</p>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div key={team.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/60">
                <p className="text-sm font-semibold text-gray-800">{team.name}</p>
                {hasFee && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${team.hasPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {team.hasPaid ? "Pagó" : "Sin pagar"}
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {team.players.map((player) => (
                  <div key={player.id} className="flex items-center gap-4 px-5 py-3">
                    <p className="text-sm font-medium text-gray-900 w-44 shrink-0 truncate">{player.name}</p>
                    <div className="flex items-center gap-4 flex-1 flex-wrap">
                      {player.phone ? (
                        <a
                          href={waLink(player.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
                        >
                          <WhatsAppIcon />
                          {player.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">Sin teléfono</span>
                      )}
                      {player.email && (
                        <a href={`mailto:${player.email}`} className="text-xs text-blue-500 hover:text-blue-700 transition-colors truncate">
                          {player.email}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
