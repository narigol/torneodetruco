"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

const MyTournamentsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 12h4m-4 4h4m-4-8h10m2 4h2m-2 4h2M3 6h18v12H3V6z"
    />
  </svg>
);

const MyRankingIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const ContactsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
    />
  </svg>
);

type Props = {
  role: string;
  name: string;
  plan: string;
  followingCount?: number;
  followersCount?: number;
  onClose?: () => void;
  collapsed?: boolean;
};

export function Sidebar({ role, name, plan, followingCount = 0, followersCount = 0, onClose, collapsed = false }: Props) {
  const pathname = usePathname();
  const isPro = plan === "PRO";
  const canOrganize = role === "ADMIN" || role === "ORGANIZER";

  const links = [
    { href: "/torneos/mis", label: "Mis torneos", icon: <MyTournamentsIcon /> },
    ...(canOrganize
      ? [
          { href: "/organizador/ranking", label: "Mi Ranking", icon: <MyRankingIcon /> },
          ...(role === "ADMIN" ? [{ href: "/usuarios", label: "Usuarios", icon: <UsersIcon /> }] : []),
          { href: "/contactos", label: "Contactos", icon: <ContactsIcon /> },
        ]
      : []),
  ];

  return (
    <aside
      className={`h-full bg-white border-r border-gray-100 flex flex-col shrink-0 transition-[width] duration-200 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="px-3 py-4 border-b border-gray-100 lg:hidden">
        <div className="flex justify-end">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Cerrar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ href, label, icon }) => {
          const active =
            pathname === href ||
            (href === "/torneos" && pathname.startsWith("/torneos/") && !pathname.startsWith("/torneos/mis")) ||
            (href !== "/torneos" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"
              } ${active ? "bg-red-50 text-red-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <span className={active ? "text-red-500" : "text-gray-400"}>{icon}</span>
              {!collapsed && label}
            </Link>
          );
        })}

        {(() => {
          const active = pathname.startsWith("/comunidad");
          const total = followingCount + followersCount;
          return (
            <Link
              href="/comunidad"
              title={collapsed ? "Comunidad" : undefined}
              className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"
              } ${active ? "bg-red-50 text-red-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <span className={active ? "text-red-500" : "text-gray-400"}>
                <UsersIcon />
              </span>
              {!collapsed && "Comunidad"}
              {!collapsed && total > 0 && (
                <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] text-center">
                  {total}
                </span>
              )}
            </Link>
          );
        })()}

        {(() => {
          const active = pathname.startsWith("/membresia");
          return (
            <Link
              href="/membresia"
              title={collapsed ? "Membresia" : undefined}
              className={`flex items-center rounded-xl text-sm font-medium transition-all ${
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"
              } ${
                active
                  ? "bg-red-50 text-red-700"
                  : isPro
                    ? "text-amber-600 hover:bg-amber-50"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className={active ? "text-red-500" : isPro ? "text-amber-500" : "text-gray-400"}>
                <StarIcon />
              </span>
              {!collapsed && "Membresia"}
              {!collapsed && isPro && (
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                  PRO
                </span>
              )}
            </Link>
          );
        })()}
      </nav>

    </aside>
  );
}
