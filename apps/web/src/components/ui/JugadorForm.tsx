"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initial?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    locality?: string | null;
  };
};

export function JugadorForm({ initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      email: form.get("email") || null,
      phone: form.get("phone") || null,
      locality: form.get("locality") || null,
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Localidad
        </label>
        <input
          name="locality"
          defaultValue={initial?.locality ?? ""}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Ej: Buenos Aires"
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
