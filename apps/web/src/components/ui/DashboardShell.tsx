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

  return (
    <div className="flex h-screen bg-[#f6f5f3]">
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

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

      <main className="flex-1 overflow-auto min-w-0">
        <DashboardTopBar
          unreadNotifications={unreadNotifications}
          onOpenMenu={() => setOpen(true)}
        />

        <div className="p-4 lg:p-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
