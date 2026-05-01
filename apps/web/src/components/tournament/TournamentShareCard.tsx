"use client";

import { useState } from "react";

type Props = {
  publicUrl: string;
};

export function TournamentShareCard({ publicUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicUrl)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Compartir torneo</h2>
          <p className="text-sm text-gray-500 mt-1">
            Usa este link publico para mostrar inscripcion y compartirlo por WhatsApp o en el club.
          </p>
        </div>
        <button
          onClick={copyLink}
          className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copied ? "Copiado" : "Copiar link"}
        </button>
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 break-all border border-gray-100">
        {publicUrl}
      </div>

      <div className="mt-5 flex justify-center rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <img
          src={qrUrl}
          alt="QR del torneo"
          className="h-52 w-52 rounded-xl bg-white p-2"
        />
      </div>
    </div>
  );
}
