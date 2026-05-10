"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardTopBar } from "./DashboardTopBar";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f5f3]">
      <DashboardTopBar
        role={role}
        name={name}
        unreadNotifications={unreadNotifications}
        onOpenMenu={() => setOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
      />

      {open && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex pt-16">
        <div
          className={`fixed top-16 left-0 bottom-0 z-30 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar
            role={role}
            name={name}
            plan={plan}
            followingCount={followingCount}
            followersCount={followersCount}
            onClose={() => setOpen(false)}
            collapsed={sidebarCollapsed}
          />
        </div>

        <div className={`hidden lg:block shrink-0 transition-[width] duration-200 ${sidebarCollapsed ? "w-20" : "w-64"}`} />

        <main className="flex-1 min-w-0">
          <div className="p-4 lg:p-8 max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
