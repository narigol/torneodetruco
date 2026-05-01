"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/torneos";

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      identifier: form.get("identifier"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email/DNI o contraseña incorrectos. Si tu cuenta está pendiente de activación, registrate con tu email o DNI.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const confirm = form.get("confirm") as string;

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        dni: form.get("dni") || null,
        locality: form.get("locality") || null,
        province: form.get("province") || null,
        country: "Argentina",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al registrarse");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      identifier: email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Cuenta creada, pero no se pudo iniciar sesión. Ingresá manualmente.");
      setMode("login");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError("");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1fr]">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex flex-col text-white p-12 relative overflow-hidden select-none bg-red-600">
        {/* Patrón con palos del naipe español */}
        <div className="absolute inset-0 opacity-[0.08]" aria-hidden>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="naipes" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                {/* Espada */}
                <g transform="translate(14,8)">
                  <line x1="12" y1="0" x2="12" y2="28" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="4" y1="18" x2="20" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <polygon points="12,0 8,12 16,12" fill="white"/>
                  <rect x="10" y="28" width="4" height="6" rx="1" fill="white"/>
                </g>
                {/* Copa */}
                <g transform="translate(74,8)">
                  <path d="M4,0 Q0,12 6,18 L6,22 L2,22 L2,26 L14,26 L14,22 L10,22 L10,18 Q16,12 12,0 Z" fill="white"/>
                </g>
                {/* Basto */}
                <g transform="translate(14,68)">
                  <rect x="9" y="0" width="6" height="26" rx="3" fill="white"/>
                  <circle cx="12" cy="4" r="6" fill="white"/>
                </g>
                {/* Oro */}
                <g transform="translate(74,68)">
                  <circle cx="12" cy="14" r="14" fill="none" stroke="white" strokeWidth="3"/>
                  <circle cx="12" cy="14" r="7" fill="none" stroke="white" strokeWidth="2"/>
                  <circle cx="12" cy="14" r="2" fill="white"/>
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#naipes)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full items-center justify-center">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/15 rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
              <span className="text-white font-bold text-3xl">TdT</span>
            </div>
            <div>
              <p className="font-bold text-white text-3xl leading-tight">Torneos de Truco</p>
              <p className="text-red-200 text-sm mt-1">Sistema de gestión</p>
            </div>
          </div>

          <p className="text-red-400 text-xs absolute bottom-8">© {new Date().getFullYear()} TdT</p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">TdT</h1>
            <p className="text-gray-500 text-sm">Torneos de Truco</p>
          </div>

          {mode === "login" ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido</h2>
              <p className="text-gray-500 text-sm mb-8">Ingresá tus credenciales para continuar</p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email o DNI</label>
                  <input
                    name="identifier"
                    type="text"
                    required
                    autoComplete="username"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white transition-colors"
                    placeholder="tu@email.com o 12345678"
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
                  <div className="mt-2 text-right">
                    <a href="/forgot-password" className="text-xs text-red-600 hover:text-red-700">
                      Olvide mi contrasena
                    </a>
                  </div>
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

              <p className="mt-6 text-center text-sm text-gray-500">
                ¿No tenés cuenta?{" "}
                <button
                  onClick={() => switchMode("register")}
                  className="text-red-600 font-medium hover:text-red-700"
                >
                  Registrate
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Crear cuenta</h2>
              <p className="text-gray-500 text-sm mb-8">Completá tus datos para registrarte</p>

              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                  <input
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    autoComplete="name"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white transition-colors"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">DNI</label>
                    <input
                      name="dni"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white transition-colors"
                      placeholder="12345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Localidad</label>
                  <input
                    name="locality"
                    type="text"
                    autoComplete="address-level2"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white transition-colors"
                    placeholder="Ciudad o localidad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Provincia</label>
                  <input
                    name="province"
                    type="text"
                    autoComplete="address-level1"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white transition-colors"
                    placeholder="Ej: Buenos Aires"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white transition-colors"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Repetir contraseña</label>
                  <input
                    name="confirm"
                    type="password"
                    required
                    autoComplete="new-password"
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
                  {loading ? "Registrando..." : "Crear cuenta"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                ¿Ya tenés cuenta?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="text-red-600 font-medium hover:text-red-700"
                >
                  Ingresá
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
