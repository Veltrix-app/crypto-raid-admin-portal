"use client";

import { Bell, ChevronDown, Command, LayoutGrid, LogOut, Menu, Search, ShieldCheck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminUIStore } from "@/store/ui/useAdminUIStore";

export default function AdminHeader() {
  const router = useRouter();
  const { email, role, logout, memberships, activeProjectId, setActiveProjectId } = useAdminAuthStore();
  const toggleSidebar = useAdminUIStore((s) => s.toggleSidebar);
  const activeProject = memberships.find((item) => item.projectId === activeProjectId);
  const identityLabel = email ? email.split("@")[0] : "portal-operator";
  const statusLabel = role === "super_admin" ? "Super admin" : activeProject?.role || role || "Project operator";

  return (
    <header className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(186,255,59,0.08),transparent_20%),linear-gradient(180deg,rgba(10,13,20,0.96),rgba(8,11,17,0.94))] px-6 py-4 backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] text-sub transition hover:border-primary/20 hover:bg-primary/10 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Toggle sidebar"
            >
              <Menu size={18} />
            </button>

            <div className="hidden min-w-0 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sub">Workspace pulse</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[16px] border border-primary/20 bg-primary/10 text-primary">
                  <LayoutGrid size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text">
                    {activeProject?.projectName || "Active workspace"}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-primary">
                    {statusLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.035] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-white/8 bg-black/20 text-sub">
              <Search size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sub">Global search</p>
              <input
                placeholder="Search campaigns, rewards, users, alerts…"
                className="mt-1 w-full bg-transparent text-sm font-medium text-text outline-none placeholder:text-sub"
                aria-label="Search portal"
              />
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 lg:flex">
              <Command size={14} className="text-sub" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">Command</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {memberships.length > 0 ? (
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sub">Workspace</p>
              <div className="mt-2 flex items-center gap-3">
                <select
                  value={activeProjectId ?? ""}
                  onChange={(e) => setActiveProjectId(e.target.value)}
                  className="min-w-[220px] bg-transparent text-sm font-bold text-text outline-none"
                  aria-label="Switch active workspace"
                >
                  {memberships.map((membership) => (
                    <option key={membership.projectId} value={membership.projectId} className="bg-card text-text">
                      {membership.projectName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="text-sub" />
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <button
              className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] text-sub transition hover:border-primary/20 hover:bg-primary/10 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            <div className="hidden rounded-[18px] border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 md:flex md:items-center md:gap-2">
              <Zap size={14} className="text-emerald-300" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                Stable
              </span>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] px-4 py-3 shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-primary/20 bg-primary/10 text-sm font-extrabold uppercase text-primary">
                  {identityLabel.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text">{email || "admin@portal.com"}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <ShieldCheck size={13} className="text-primary" />
                    <p className="text-[11px] uppercase tracking-[0.16em] text-primary">{statusLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] text-sub transition hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
