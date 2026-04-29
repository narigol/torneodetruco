"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArgentinaGeoSelect } from "./ArgentinaGeoSelect";

type Props = {
  initial?: {
    id: string;
    name: string;
    dni?: string | null;
    email?: string | null;
    phone?: string | null;
    locality?: string | null;
    province?: string | null;
    country?: string | null;
  };
};

export function JugadorForm({ initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [locality, setLocality] = useState(initial?.locality ?? "");
  const [province, setProvince] = useState(initial?.province ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      dni: form.get("dni") || null,
      email: form.get("email") || null,
      phone: form.get("phone") || null,
      locality: locality || null,
      province: province || null,
      country: "Argentina",
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

  const inputClass =
    "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
        <input
          name="name"
          required
          defaultValue={initial?.name}
          className={inputClass}
          placeholder="Nombre completo"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">DNI</label>
          <input
            name="dni"
            inputMode="numeric"
            defaultValue={initial?.dni ?? ""}
            className={inputClass}
            placeholder="12345678"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
          <input
            name="phone"
            type="tel"
            defaultValue={initial?.phone ?? ""}
            className={inputClass}
            placeholder="11 1234-5678"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input
          name="email"
          type="email"
          defaultValue={initial?.email ?? ""}
          className={inputClass}
          placeholder="jugador@email.com"
        />
      </div>

      <ArgentinaGeoSelect
        locality={locality}
        province={province}
        onLocalityChange={setLocality}
        onProvinceChange={setProvince}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3.5 py-2.5 rounded-xl">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : initial ? "Guardar cambios" : "Crear jugador"}
        </button>
      </div>
    </form>
  );
}
