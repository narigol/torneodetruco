"use client";

import Link from "next/link";

const TYPE_LABEL: Record<string, { text: string; color: string }> = {
  TOURNAMENT_CREATED:    { text: "Nuevo torneo",        color: "bg-blue-100 text-blue-700" },
  REGISTRATION_OPEN:     { text: "Inscripción abierta", color: "bg-green-100 text-green-700" },
  TOURNAMENT_STARTED:    { text: "Torneo iniciado",     color: "bg-amber-100 text-amber-700" },
  TOURNAMENT_FINISHED:   { text: "Torneo finalizado",   color: "bg-gray-100 text-gray-600" },
  LOCATION_INVITE:       { text: "Torneo en tu zona",   color: "bg-purple-100 text-purple-700" },
  TOURNAMENT_INVITATION: { text: "Invitación",          color: "bg-purple-100 text-purple-700" },
};

type Props = {
  type: string;
  read: boolean;
  createdAt: string;
  message: string | null;
  tournament: {
    id: string;
    name: string;
    admin: { name: string };
  } | null;
};

export function NotificationItem({ type, read, createdAt, message, tournament }: Props) {
  const cfg = TYPE_LABEL[type] ?? { text: type, color: "bg-gray-100 text-gray-600" };

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
        read ? "bg-white border-gray-100" : "bg-blue-50/40 border-blue-100"
      }`}
    >
      {!read && <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
      {read && <span className="mt-1.5 w-2 h-2 shrink-0" />}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
            {cfg.text}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(createdAt).toLocaleDateString("es-AR", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </div>

        {message && <p className="text-sm text-gray-700 mb-0.5">{message}</p>}

        {tournament && (
          <>
            <Link
              href={`/torneos/${tournament.id}`}
              className="text-sm font-medium text-gray-900 hover:text-red-700 truncate block"
            >
              {tournament.name}
            </Link>
            <p className="text-xs text-gray-400">por {tournament.admin.name}</p>
          </>
        )}
      </div>
    </div>
  );
}
