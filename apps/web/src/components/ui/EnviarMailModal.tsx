"use client";

import { useState } from "react";

type Props = {
  recipients: Array<{ name: string; email: string }>;
  onClose: () => void;
};

export function EnviarMailModal({ recipients, onClose }: Props) {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [sent, setSent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", message: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const BATCH = 200;
      const totalBatches = Math.ceil(recipients.length / BATCH);
      let totalSent = 0;
      for (let i = 0; i < recipients.length; i += BATCH) {
        const chunk = recipients.slice(i, i + BATCH);
        setProgress({ current: Math.floor(i / BATCH) + 1, total: totalBatches });
        const res = await fetch("/api/contactos/enviar-mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: form.subject.trim(), message: form.message.trim(), contactos: chunk }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error ?? "Error al enviar");
        totalSent += d.sent ?? 0;
      }
      setSent(totalSent);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        {sent !== null ? (
          <div className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900 mb-1">{sent}</p>
            <p className="text-sm text-gray-500 mb-6">
              {sent === 1 ? "mail enviado" : "mails enviados"}
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Enviar mail</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {recipients.length} destinatario{recipients.length !== 1 ? "s" : ""} con email
              </p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Asunto *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Asunto del mail"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Mensaje *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y"
                  placeholder="Escribí tu mensaje..."
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sending || !form.subject.trim() || !form.message.trim()}
                  className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {sending && progress && progress.total > 1
                    ? `Enviando ${progress.current}/${progress.total}...`
                    : sending ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
