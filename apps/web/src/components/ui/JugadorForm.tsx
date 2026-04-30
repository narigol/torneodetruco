"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROVINCIAS, LOCALIDADES, type Provincia } from "@/lib/argentina";

type Props = {
  initial?: {
    id: string;
    name: string;
    email?: string | null;
    dni?: string | null;
    phone?: string | null;
    locality?: string | null;
    provincia?: string | null;
  };
};

export function JugadorForm({ initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [provincia, setProvincia] = useState<Provincia | "">(
    (initial?.provincia as Provincia) ?? ""
  );
  const [locality, setLocality] = useState(initial?.locality ?? "");

  const localidades = provincia ? LOCALIDADES[provincia] : [];

  function handleProvinciaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setProvincia(e.target.value as Provincia | "");
    setLocality("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      email: form.get("email") || null,
      dni: form.get("dni") || null,
      phone: form.get("phone") || null,
      locality: locality || null,
      provincia: provincia || null,
    };

    const res = initial
      ? await fetch(`/api/jugadores/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/jugadores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
      return;
    }

    router.push("/jugadores");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-white border border-gray-100 rounded-xl p-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre *
        </label>
        <input
          name="name"
          required
          defaultValue={initial?.name}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Nombre completo del jugador"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          name="email"
          type="email"
          defaultValue={initial?.email ?? ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="jugador@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          DNI
        </label>
        <input
          name="dni"
          type="text"
          defaultValue={initial?.dni ?? ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Ej: 30123456"
        />
        <p className="text-xs text-gray-400 mt-1">Permite vincular este jugador con su cuenta de usuario</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Provincia
        </label>
        <select
          value={provincia}
          onChange={handleProvinciaChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
        >
          <option value="">— Seleccioná una provincia —</option>
          {PROVINCIAS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Localidad
        </label>
        <select
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          disabled={!provincia}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {provincia ? "— Seleccioná una localidad —" : "— Primero elegí una provincia —"}
          </option>
          {localidades.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono
        </label>
        <input
          name="phone"
          type="tel"
          defaultValue={initial?.phone ?? ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Ej: 11 1234-5678"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : initial ? "Guardar cambios" : "Crear jugador"}
        </button>
      </div>
    </form>
  );
}
