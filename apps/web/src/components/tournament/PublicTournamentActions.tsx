"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type UserData = {
  name: string;
  email: string;
  dni: string;
  phone: string;
};

type Props = {
  tournamentId: string;
  playersPerTeam: number;
  loggedIn: boolean;
  callbackUrl: string;
  initialInscripto?: boolean;
  initialPending?: boolean;
  userData?: UserData;
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
  readOnly,
  required,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
          readOnly
            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-default"
            : "bg-white border-gray-200 focus:bg-white"
        }`}
      />
    </div>
  );
}

export function PublicTournamentActions({
  tournamentId,
  playersPerTeam,
  loggedIn,
  callbackUrl,
  initialInscripto,
  initialPending,
  userData,
}: Props) {
  const router = useRouter();
  const [inscripto, setInscripto] = useState(initialInscripto ?? false);
  const [pending, setPending] = useState(initialPending ?? false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState("");

  // Mis datos
  const [myName] = useState(userData?.name ?? "");
  const [myEmail] = useState(userData?.email ?? "");
  const [myDni, setMyDni] = useState(userData?.dni ?? "");
  const [myPhone, setMyPhone] = useState(userData?.phone ?? "");

  // Datos de la pareja
  const [partnerName, setPartnerName] = useState("");
  const [partnerDni, setPartnerDni] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");

  const needsPartner = playersPerTeam > 1;

  async function handleSubmit() {
    setError("");

    if (!myDni.trim() || !myPhone.trim()) {
      setError("Completá tu DNI y teléfono para continuar.");
      return;
    }
    if (needsPartner) {
      if (!partnerName.trim() || !partnerDni.trim() || !partnerEmail.trim() || !partnerPhone.trim()) {
        setError("Completá todos los datos de tu pareja.");
        return;
      }
    }

    setLoading(true);
    const res = await fetch(`/api/torneos/${tournamentId}/inscribirse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        myDni: myDni.trim(),
        myPhone: myPhone.trim(),
        partnerName: needsPartner ? partnerName.trim() : undefined,
        partnerDni: needsPartner ? partnerDni.trim() : undefined,
        partnerEmail: needsPartner ? partnerEmail.trim() : undefined,
        partnerPhone: needsPartner ? partnerPhone.trim() : undefined,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo completar la inscripcion.");
      return;
    }

    setPending(true);
    setShowForm(false);
    router.refresh();
  }

  if (!loggedIn) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
      >
        Iniciar sesion para inscribirme
      </Link>
    );
  }

  async function handleCancelar() {
    setCancelLoading(true);
    const res = await fetch(`/api/torneos/${tournamentId}/inscribirse`, { method: "DELETE" });
    setCancelLoading(false);
    if (res.ok) {
      setInscripto(false);
      setPending(false);
      setPartnerName("");
      setPartnerDni("");
      setPartnerEmail("");
      setPartnerPhone("");
      router.refresh();
    }
  }

  if (pending) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
        <span className="text-sm font-medium text-amber-700 flex-1">
          Tu inscripción está pendiente de aprobación por el organizador.
        </span>
        <button
          onClick={handleCancelar}
          disabled={cancelLoading}
          className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors shrink-0"
        >
          {cancelLoading ? "..." : "Cancelar"}
        </button>
      </div>
    );
  }

  if (inscripto) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
        <span className="text-sm font-medium text-green-700 flex-1">Ya quedaste inscripto en este torneo. ✓</span>
        <button
          onClick={handleCancelar}
          disabled={cancelLoading}
          className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors shrink-0"
        >
          {cancelLoading ? "..." : "Cancelar inscripción"}
        </button>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
      >
        Quiero inscribirme
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-4">
      <div className={`grid gap-4 ${needsPartner ? "md:grid-cols-2" : ""}`}>
        {/* Mis datos */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Tus datos</p>
          <Field label="Nombre" value={myName} readOnly />
          <Field label="Email" value={myEmail} readOnly />
          <Field
            label="DNI"
            value={myDni}
            onChange={setMyDni}
            inputMode="numeric"
            placeholder="Ej: 30281569"
            required
          />
          <Field
            label="Teléfono"
            value={myPhone}
            onChange={setMyPhone}
            inputMode="tel"
            placeholder="Ej: 2215551234"
            required
          />
        </div>

        {/* Datos de la pareja */}
        {needsPartner && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Tu pareja</p>
            <Field
              label="Nombre"
              value={partnerName}
              onChange={setPartnerName}
              placeholder="Nombre completo"
              required
            />
            <Field
              label="Email"
              value={partnerEmail}
              onChange={setPartnerEmail}
              type="email"
              placeholder="email@ejemplo.com"
              required
            />
            <Field
              label="DNI"
              value={partnerDni}
              onChange={setPartnerDni}
              inputMode="numeric"
              placeholder="Ej: 30281569"
              required
            />
            <Field
              label="Teléfono"
              value={partnerPhone}
              onChange={setPartnerPhone}
              inputMode="tel"
              placeholder="Ej: 2215551234"
              required
            />
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Enviando..." : "Confirmar inscripcion"}
        </button>
        <button
          onClick={() => { setShowForm(false); setError(""); }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
