"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email o contraseña incorrectos");
    } else {
      router.push("/torneos");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1fr]">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex flex-col bg-red-700 text-white p-12 relative overflow-hidden select-none">
        <div className="absolute inset-0 opacity-[0.06]" aria-hidden>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="suits" x="0" y="0" width="90" height="90" patternUnits="userSpaceOnUse">
                <text x="8" y="36" fontSize="32" fill="white">♠</text>
                <text x="52" y="78" fontSize="32" fill="white">♣</text>
                <text x="52" y="36" fontSize="26" fill="white">♥</text>
                <text x="8" y="78" fontSize="26" fill="white">♦</text>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#suits)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center border border-white/20">
              <span className="text-white font-bold text-sm">TdT</span>
            </div>
            <div>
              <p className="font-bold text-white leading-none text-sm">Torneos de Truco</p>
              <p className="text-red-200 text-xs mt-0.5">Sistema de gestión</p>
            </div>
          </div>

          <div className="flex-1 flex items-center">
            <div>
              <div className="text-5xl mb-6">🃏</div>
              <blockquote className="text-[1.6rem] font-light leading-snug text-red-50 max-w-xs">
                "El arte del Truco<br />vive en cada mano"
              </blockquote>
              <p className="text-red-300 text-sm mt-5 leading-relaxed max-w-xs">
                Organizá torneos, registrá resultados y seguí el camino al campeonato.
              </p>
            </div>
          </div>

          <p className="text-red-400 text-xs">© {new Date().getFullYear()} TdT</p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">TdT</h1>
            <p className="text-gray-500 text-sm">Torneos de Truco</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido</h2>
          <p className="text-gray-500 text-sm mb-8">Ingresá tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-100 px-3.5 py-3 rounded-xl">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2.5 px-4 rounded-xl font-semibold text-sm hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
