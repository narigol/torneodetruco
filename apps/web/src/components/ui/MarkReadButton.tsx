"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAll() {
    setLoading(true);
    await fetch("/api/notificaciones", { method: "PATCH" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={markAll}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors disabled:opacity-50"
    >
      {loading ? "..." : "Marcar todas como leídas"}
    </button>
  );
}
