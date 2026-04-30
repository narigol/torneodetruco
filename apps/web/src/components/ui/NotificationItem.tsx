"use client";

import { useState } from "react";
import Link from "next/link";
import { InvitacionActions } from "@/components/ui/InvitacionActions";

const TYPE_LABEL: Record<string, { text: string; color: string }> = {
  TOURNAMENT_CREATED:    { text: "Nuevo torneo",        color: "bg-blue-100 text-blue-700" },
  REGISTRATION_OPEN:     { text: "Inscripción abierta", color: "bg-green-100 text-green-700" },
  TOURNAMENT_STARTED:    { text: "Torneo iniciado",     color: "bg-amber-100 text-amber-700" },
  TOURNAMENT_FINISHED:   { text: "Torneo finalizado",   color: "bg-gray-100 text-gray-600" },
  LOCATION_INVITE:       { text: "Torneo en tu zona",   color: "bg-purple-100 text-purple-700" },
  TOURNAMENT_INVITATION: { text: "Invitación",          color: "bg-purple-100 text-purple-700" },
};

type Props = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  message: string | null;
  alreadyInterested: boolean;
  invitationId: string | null;
  invitationStatus: string | null;
  tournament: {
    id: string;
    name: string;
    admin: { name: string };
  } | null;
};

export function NotificationItem({
  type, read, createdAt, message, alreadyInterested, invitationId, invitationStatus, tournament,
}: Props) {
  const [interested, setInterested] = useState(alreadyInterested);
  const [loading, setLoading] = useState(false);

  const cfg = TYPE_LABEL[type] ?? { text: type, color: "bg-gray-100 text-gray-600" };
  const isLocationInvite = type === "LOCATION_INVITE";
  const isInvitation = type === "TOURNAMENT_INVITATION";

  async function toggleInterest() {
    if (!tournament) return;
    setLoading(true);
    const method = interested ? "DELETE" : "POST";
    await fetch(`/api/torneos/${tournament.id}/interesado`, { method });
    setInterested((v) => !v);
    setLoading(false);
  }

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

        {isLocationInvite && tournament && (
          <button
            onClick={toggleInterest}
            disabled={loading}
            className={`mt-2.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
              interested
                ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {loading ? "..." : interested ? "✓ Me apunté — cancelar" : "Aceptar invitación"}
          </button>
        )}

        {isInvitation && invitationId && (
          <InvitacionActions
            invitacionId={invitationId}
            currentStatus={invitationStatus ?? "PENDING"}
          />
        )}
      </div>
    </div>
  );
}
