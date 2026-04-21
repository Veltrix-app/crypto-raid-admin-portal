"use client";

import { Bell, ChevronDown, LogOut, Menu, Search, ShieldCheck, Zap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getPortalPageMetadata } from "@/lib/layout/page-metadata";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminUIStore } from "@/store/ui/useAdminUIStore";

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { email, role, logout, memberships, activeProjectId, setActiveProjectId } =
    useAdminAuthStore();
  const toggleSidebar = useAdminUIStore((s) => s.toggleSidebar);
  const activeProject = memberships.find((item) => item.projectId === activeProjectId);
  const identityLabel = email ? email.split("@")[0] : "operator";
  const statusLabel =
    role === "super_admin" ? "Super admin" : activeProject?.role || role || "Project operator";
  const pageMeta = getPortalPageMetadata(pathname, activeProject?.projectName);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[radial-gradient(circle_at_top_right,rgba(186,255,59,0.06),transparent_18%),linear-gradient(180deg,rgba(10,13,20,0.94),rgba(8,11,17,0.92))] px-6 py-4 backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-line bg-white/[0.04] text-sub transition hover:border-primary/20 hover:bg-primary/10 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Toggle sidebar"
            >
              <Menu size={18} />
            </button>

            <div className="hidden min-w-0 sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sub">
                {pageMeta.eyebrow}
              </p>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight text-text">
                {pageMeta.title}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-sub">{pageMeta.description}</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[24px] border border-line bg-[linear-gradient(180deg,rgba(18,26,38,0.84),rgba(13,19,29,0.9))] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-white/8 bg-black/20 text-sub">
              <Search size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sub">
                Global search
              </p>
              <input
                placeholder="Search projects, launches, cases and operators..."
                className="mt-1 w-full bg-transparent text-sm font-medium text-text outline-none placeholder:text-sub"
                aria-label="Search portal"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {memberships.length > 0 ? (
            <div className="rounded-[22px] border border-line bg-[linear-gradient(180deg,rgba(18,26,38,0.84),rgba(13,19,29,0.9))] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sub">
                Workspace
              </p>
              <div className="mt-2 flex items-center gap-3">
                <select
                  value={activeProjectId ?? ""}
                  onChange={(e) => setActiveProjectId(e.target.value)}
                  className="min-w-[220px] bg-transparent text-sm font-bold text-text outline-none"
                  aria-label="Switch active workspace"
                >
                  {memberships.map((membership) => (
                    <option
                      key={membership.projectId}
                      value={membership.projectId}
                      className="bg-card text-text"
                    >
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
              className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-line bg-white/[0.04] text-sub transition hover:border-primary/20 hover:bg-primary/10 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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

            <div className="rounded-[24px] border border-line bg-[linear-gradient(180deg,rgba(19,28,40,0.95),rgba(13,19,29,0.95))] px-4 py-3 shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-primary/20 bg-primary/10 text-sm font-extrabold uppercase text-primary">
                  {identityLabel.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text">
                    {email || "admin@portal.com"}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <ShieldCheck size={13} className="text-primary" />
                    <p className="text-[11px] uppercase tracking-[0.16em] text-primary">
                      {statusLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-line bg-white/[0.04] text-sub transition hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
