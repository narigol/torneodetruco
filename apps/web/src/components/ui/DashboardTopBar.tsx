"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  unreadNotifications: number;
  onOpenMenu: () => void;
};

const primaryLinks = [
  { href: "/torneos", label: "Torneos" },
  { href: "/reglamentos", label: "Reglamentos" },
  { href: "/ranking", label: "Ranking" },
  { href: "/notificaciones", label: "Notificaciones" },
];

function isActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href === "/torneos" && pathname.startsWith("/torneos/") && !pathname.startsWith("/torneos/mis")) ||
    (href !== "/torneos" && pathname.startsWith(`${href}/`))
  );
}

export function DashboardTopBar({ unreadNotifications, onOpenMenu }: Props) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-[#f6f5f3]/95 backdrop-blur">
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

          <div className="flex items-center gap-2 pr-2 lg:pr-4 shrink-0 lg:hidden">
            <div className="w-7 h-7 bg-red-600 rounded-md flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-[10px]">TdT</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm hidden sm:inline">Torneos de Truco</span>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto">
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
        </div>
      </div>
    </header>
  );
}
