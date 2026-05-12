"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type Props = {
  role: string;
  name: string;
  unreadNotifications: number;
  onOpenMenu: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

const primaryLinks = [
  { href: "/torneos", label: "Torneos" },
  { href: "/reglamentos", label: "Reglamentos" },
  { href: "/ranking", label: "Ranking" },
  { href: "/notificaciones", label: "Notificaciones" },
];

function roleLabel(role: string) {
  if (role === "ADMIN") return "Super Admin";
  if (role === "ORGANIZER") return "Organizador";
  return "Jugador";
}

function isActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href === "/torneos" && pathname.startsWith("/torneos/") && !pathname.startsWith("/torneos/mis")) ||
    (href !== "/torneos" && pathname.startsWith(`${href}/`))
  );
}

export function DashboardTopBar({
  role,
  name,
  unreadNotifications,
  onOpenMenu,
  sidebarCollapsed,
  onToggleSidebar,
}: Props) {
  const pathname = usePathname();
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-stone-200/80 bg-[#f6f5f3]/95 backdrop-blur">
      <div className="px-4 lg:px-8">
        <div className="flex h-16 items-center gap-3">
          <button
            onClick={onOpenMenu}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-700 transition-colors"
            aria-label="Abrir menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <button
            onClick={onToggleSidebar}
            className="hidden lg:inline-flex p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-700 transition-colors"
            aria-label={sidebarCollapsed ? "Mostrar sidebar" : "Ocultar sidebar"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>

          <Link href="/torneos" className="flex items-center gap-2 pr-2 lg:pr-6 shrink-0">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold text-xs">TdT</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-none">Torneos de Truco</p>
              <p className="text-xs text-gray-500 leading-none mt-1 hidden sm:block">Sistema de gestion</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto min-w-0">
            {primaryLinks.map(({ href, label }) => {
              const active = isActive(pathname, href);
              const isNotifications = href === "/notificaciones";
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white text-gray-900 shadow-sm ring-1 ring-stone-200"
                      : "text-gray-500 hover:text-gray-900 hover:bg-white/70"
                  }`}
                >
                  {label}
                  {isNotifications && unreadNotifications > 0 && (
                    <span className="ml-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-blue-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Link
              href="/perfil"
              className="flex items-center gap-3 rounded-full border border-stone-200 bg-white/90 px-2.5 py-1.5 text-sm hover:bg-white transition-colors min-w-0"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span className="text-red-700 text-xs font-bold">{initials}</span>
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                <p className="text-xs text-gray-400 leading-none mt-0.5">{roleLabel(role)}</p>
              </div>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Cerrar sesion"
              className="hidden sm:inline-flex items-center justify-center rounded-full border border-stone-200 bg-white/90 p-2 text-gray-500 hover:text-red-600 hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
