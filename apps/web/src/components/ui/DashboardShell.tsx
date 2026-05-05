"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

type Props = {
  role: string;
  name: string;
  plan: string;
  unreadNotifications: number;
  followingCount: number;
  followersCount: number;
  children: React.ReactNode;
};

export function DashboardShell({
  children,
  role,
  name,
  plan,
  unreadNotifications,
  followingCount,
  followersCount,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f6f5f3]">
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto lg:h-full transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar
          role={role}
          name={name}
          plan={plan}
          unreadNotifications={unreadNotifications}
          followingCount={followingCount}
          followersCount={followersCount}
          onClose={() => setOpen(false)}
        />
      </div>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Top bar mobile */}
        <div className="lg:hidden sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-[10px]">TdT</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Torneos de Truco</span>
          </div>
        </div>

        <div className="p-4 lg:p-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
