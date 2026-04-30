"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  invitacionId: string;
  currentStatus: string;
};

export function InvitacionActions({ invitacionId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const [status, setStatus] = useState(currentStatus);

  async function respond(newStatus: "ACCEPTED" | "REJECTED") {
    setLoading(newStatus);
    const res = await fetch(`/api/invitaciones/${invitacionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(null);
    if (res.ok) {
      setStatus(newStatus);
      router.refresh();
    }
  }

  if (status === "ACCEPTED") {
    return <span className="text-xs text-green-600 font-medium">Invitación aceptada</span>;
  }
  if (status === "REJECTED") {
    return <span className="text-xs text-gray-400">Invitación rechazada</span>;
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={(e) => { e.preventDefault(); respond("ACCEPTED"); }}
        disabled={!!loading}
        className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading === "ACCEPTED" ? "..." : "Aceptar"}
      </button>
      <button
        onClick={(e) => { e.preventDefault(); respond("REJECTED"); }}
        disabled={!!loading}
        className="px-3 py-1.5 text-xs font-medium bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {loading === "REJECTED" ? "..." : "Rechazar"}
      </button>
    </div>
  );
}
