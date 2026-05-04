"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PendingTeam = {
  id: string;
  name: string;
  players: { name: string }[];
};

export function PendingTeamsPanel({ teams }: { teams: PendingTeam[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(teamId: string, action: "approve" | "reject") {
    setLoading(teamId);
    await fetch(`/api/equipos/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    router.refresh();
  }

  if (teams.length === 0) return null;

  return (
    <div className="mb-6 bg-amber-50 border border-amber-100 rounded-xl p-4">
      <p className="text-sm font-semibold text-amber-800 mb-3">
        {teams.length} solicitud{teams.length !== 1 ? "es" : ""} pendiente{teams.length !== 1 ? "s" : ""} de aprobación
      </p>
      <div className="space-y-2">
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2.5 border border-amber-100"
          >
            <div>
              <span className="font-medium text-gray-900">{team.name}</span>
              <span className="text-xs text-gray-400 ml-2">
                {team.players.map((p) => p.name).join(", ")}
              </span>
            </div>
            <div className="flex gap-2 shrink-0 ml-3">
              <button
                onClick={() => handleAction(team.id, "reject")}
                disabled={loading === team.id}
                className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={() => handleAction(team.id, "approve")}
                disabled={loading === team.id}
                className="text-xs px-2.5 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading === team.id ? "..." : "Aprobar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
