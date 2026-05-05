"use client";

import { useState, useMemo } from "react";
import { EmptyState } from "@/components/ui/EmptyState";

type Contacto = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  dni: string | null;
  locality: string | null;
  provincia: string | null;
  userId: string | null;
  torneos: string[];
};

type Props = { contactos: Contacto[] };

function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  const number = /^54/.test(digits) ? digits : `549${digits}`;
  return `https://wa.me/${number}`;
}

function WhatsAppIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
      className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
      title="Copiar"
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}

export function ContactosPageClient({ contactos }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contactos;
    return contactos.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.dni ?? "").includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q) ||
      (c.locality ?? "").toLowerCase().includes(q)
    );
  }, [contactos, search]);

  const allPhones = contactos.filter((c) => c.phone).map((c) => c.phone!).join("\n");
  const allEmails = contactos.filter((c) => c.email).map((c) => c.email!).join("\n");

  return (
    <div className="space-y-5">
      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, DNI, email, localidad o torneo..."
          className="min-w-[20rem] flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        />
        <CopyAll label={`${contactos.filter((c) => c.phone).length} teléfonos`} text={allPhones} disabled={!allPhones} />
        <CopyAll label={`${contactos.filter((c) => c.email).length} emails`} text={allEmails} disabled={!allEmails} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No se encontraron contactos" />
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium">Jugador</th>
                <th className="text-left px-5 py-3 font-medium">Teléfono</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Localidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      {c.userId ? (
                        <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded-full font-medium">Registrado</span>
                      ) : (
                        <span className="text-xs bg-gray-50 text-gray-400 border border-gray-100 px-1.5 py-0.5 rounded-full font-medium">Jugador</span>
                      )}
                    </div>
                    {c.dni && <p className="text-xs text-gray-400 font-mono mt-0.5">DNI {c.dni}</p>}
                  </td>
                  <td className="px-5 py-3">
                    {c.phone ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={waLink(c.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 font-medium transition-colors"
                        >
                          <WhatsAppIcon />
                          {c.phone}
                        </a>
                        <CopyButton text={c.phone} />
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {c.email ? (
                      <div className="flex items-center gap-2">
                        <a href={`mailto:${c.email}`} className="text-blue-500 hover:text-blue-700 transition-colors">
                          {c.email}
                        </a>
                        <CopyButton text={c.email} />
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {[c.locality, c.provincia].filter(Boolean).join(", ") || <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CopyAll({ label, text, disabled }: { label: string; text: string; disabled: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      disabled={disabled}
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
      className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {copied ? "✓ Copiado" : `Copiar ${label}`}
    </button>
  );
}
