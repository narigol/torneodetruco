"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Usuario = {
  id: string;
  name: string;
  email: string;
  dni: string | null;
  phone: string | null;
  locality: string | null;
  province: string | null;
};

type Props = { usuario: Usuario };

export function EditarUsuarioForm({ usuario }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: usuario.name,
    email: usuario.email,
    dni: usuario.dni ?? "",
    phone: usuario.phone ?? "",
    locality: usuario.locality ?? "",
    province: usuario.province ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/usuarios/${usuario.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        dni: form.dni || null,
        phone: form.phone || null,
        locality: form.locality || null,
        province: form.province || null,
      }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(`/usuarios/${usuario.id}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
        <input
          value={form.dni}
          onChange={(e) => set("dni", e.target.value)}
          placeholder="Sin DNI"
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
        <input
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="Sin teléfono"
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
          <input
            value={form.locality}
            onChange={(e) => set("locality", e.target.value)}
            placeholder="Ciudad"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
          <input
            value={form.province}
            onChange={(e) => set("province", e.target.value)}
            placeholder="Provincia"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
