"use client";

import { Bell, LogOut, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminUIStore } from "@/store/ui/useAdminUIStore";

export default function AdminHeader() {
  const router = useRouter();
  const { email, role, logout } = useAdminAuthStore();
  const toggleSidebar = useAdminUIStore((s) => s.toggleSidebar);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-line bg-card/70 px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-2xl border border-line bg-card2 p-3 text-sub transition hover:text-text"
        >
          <Menu size={18} />
        </button>

        <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-line bg-card2 px-4 py-3">
          <Search size={16} className="text-sub" />
          <input
            placeholder="Search campaigns, raids, rewards..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-sub"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-2xl border border-line bg-card2 p-3 text-sub transition hover:text-text">
          <Bell size={18} />
        </button>

        <div className="rounded-2xl border border-line bg-card2 px-4 py-3 text-right">
          <p className="text-sm font-semibold text-text">{email || "admin@portal.com"}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">
            {role || "project_admin"}
          </p>
        </div>

        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="rounded-2xl border border-line bg-card2 p-3 text-sub transition hover:text-text"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}