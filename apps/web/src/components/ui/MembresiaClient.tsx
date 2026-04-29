"use client";

import { useState } from "react";

type Props = {
  plan: string;
  planExpiresAt: string | null;
  precio: number;
};

const CheckIcon = () => (
  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const benefits = [
  { label: "Crear torneos ilimitados", pro: true, free: false },
  { label: "Gestionar equipos y jugadores", pro: true, free: false },
  { label: "Generar grupos y llaves eliminatorias", pro: true, free: false },
  { label: "Cargar resultados de partidos", pro: true, free: false },
  { label: "Ver torneos y standings", pro: true, free: true },
];

export function MembresiaClient({ plan, planExpiresAt, precio }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isPro = plan === "PRO";

  const expiresDate = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  async function handleCheckout() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/membresia/checkout", { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al iniciar el pago");
      setLoading(false);
      return;
    }
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="space-y-6">
      {/* Estado actual */}
      {isPro ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-green-800">Plan Organizador activo</p>
            {expiresDate && (
              <p className="text-sm text-green-600 mt-0.5">Vence el {expiresDate}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-700">Plan Jugador (gratuito)</p>
            <p className="text-sm text-gray-400 mt-0.5">Solo podés ver torneos y resultados</p>
          </div>
        </div>
      )}

      {/* Comparación de planes */}
      <div className="grid grid-cols-2 gap-4">
        {/* Free */}
        <div className={`bg-white border rounded-2xl p-5 ${!isPro ? "border-gray-300 ring-2 ring-gray-200" : "border-gray-100"}`}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Jugador</p>
          <p className="text-2xl font-bold text-gray-900 mb-4">Gratis</p>
          <ul className="space-y-2.5">
            {benefits.map((b) => (
              <li key={b.label} className="flex items-center gap-2 text-sm text-gray-600">
                {b.free ? <CheckIcon /> : <XIcon />}
                <span className={b.free ? "" : "text-gray-400"}>{b.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className={`bg-white border rounded-2xl p-5 ${isPro ? "border-red-300 ring-2 ring-red-100" : "border-gray-100"}`}>
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Organizador</p>
          <p className="text-2xl font-bold text-gray-900 mb-4">
            ${precio.toLocaleString("es-AR")}
            <span className="text-sm font-normal text-gray-400"> /año</span>
          </p>
          <ul className="space-y-2.5">
            {benefits.map((b) => (
              <li key={b.label} className="flex items-center gap-2 text-sm text-gray-600">
                {b.pro ? <CheckIcon /> : <XIcon />}
                {b.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      {!isPro && (
        <div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl mb-4">
              {error}
            </p>
          )}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? "Redirigiendo a MercadoPago..." : "Suscribirme al plan Organizador"}
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            Pago seguro a través de MercadoPago. Podés pagar con tarjeta, débito o efectivo.
          </p>
        </div>
      )}
    </div>
  );
}
