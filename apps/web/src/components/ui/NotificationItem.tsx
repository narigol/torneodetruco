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
  alreadyInscripto: boolean;
  invitationId: string | null;
  invitationStatus: string | null;
  tournament: {
    id: string;
    name: string;
    playersPerTeam: number;
    admin: { name: string };
  } | null;
};

export function NotificationItem({
  type, read, createdAt, message, alreadyInscripto, invitationId, invitationStatus, tournament,
}: Props) {
  const [inscripto, setInscripto] = useState(alreadyInscripto);
  const [showForm, setShowForm] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [partnerDni, setPartnerDni] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const cfg = TYPE_LABEL[type] ?? { text: type, color: "bg-gray-100 text-gray-600" };
  const isLocationInvite = type === "LOCATION_INVITE";
  const isInvitation = type === "TOURNAMENT_INVITATION";
  const needsPartner = (tournament?.playersPerTeam ?? 2) > 1;

  async function handleInscribirse() {
    if (!tournament) return;
    setFormError("");
    if (needsPartner && !partnerName.trim()) {
      setFormError("El nombre del compañero es obligatorio");
      return;
    }
    setFormLoading(true);
    const res = await fetch(`/api/torneos/${tournament.id}/inscribirse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerName: partnerName.trim() || undefined,
        partnerDni: partnerDni.trim() || undefined,
        partnerEmail: partnerEmail.trim() || undefined,
      }),
    });
    setFormLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error ?? "Error al inscribirse");
      return;
    }
    setInscripto(true);
    setShowForm(false);
  }

  async function handleCancelar() {
    if (!tournament) return;
    setFormLoading(true);
    await fetch(`/api/torneos/${tournament.id}/inscribirse`, { method: "DELETE" });
    setFormLoading(false);
    setInscripto(false);
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
          <div className="mt-2.5">
            {inscripto ? (
              <button
                onClick={handleCancelar}
                disabled={formLoading}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600"
              >
                {formLoading ? "..." : "✓ Inscripto — cancelar"}
              </button>
            ) : !showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                Anotarme
              </button>
            ) : (
              <div className="space-y-2 mt-1">
                {needsPartner && (
                  <>
                    <input
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="Nombre de tu pareja *"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={partnerDni}
                        onChange={(e) => setPartnerDni(e.target.value)}
                        placeholder="DNI (opcional)"
                        inputMode="numeric"
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                      />
                      <input
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        placeholder="Email (opcional)"
                        type="email"
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </>
                )}
                {formError && (
                  <p className="text-xs text-red-600">{formError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleInscribirse}
                    disabled={formLoading}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {formLoading ? "..." : "Confirmar inscripción"}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setFormError(""); }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
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
