"use client";

import { Bell, LogOut, Search, ShieldCheck, Zap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { getPortalPageMetadata } from "@/lib/layout/page-metadata";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { email, role, logout, memberships, activeProjectId, setActiveProjectId } =
    useAdminAuthStore();
  const { accessState } = useAccountEntryGuard();
  const activeProject = memberships.find((item) => item.projectId === activeProjectId);
  const primaryAccount = accessState?.primaryAccount ?? null;
  const identityLabel = email ? email.split("@")[0] : "operator";
  const statusLabel =
    role === "super_admin" ? "Super admin" : activeProject?.role || role || "Project operator";
  const pageMeta = getPortalPageMetadata(pathname, activeProject?.projectName);

  return (
    <header className="sticky top-0 z-30 border-b border-white/6 bg-[#040608]/88 backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,460px)_auto] xl:items-center">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sub">{pageMeta.eyebrow}</p>
            <h1 className="mt-1.5 text-[1.2rem] font-semibold tracking-[-0.03em] text-text sm:text-[1.45rem]">
              {pageMeta.title}
            </h1>
            <p className="mt-1.5 max-w-3xl text-[13px] leading-5 text-sub">{pageMeta.description}</p>
          </div>

          <label className="flex min-w-0 items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
            <Search size={15} className="text-sub" />
            <input
              placeholder="Search projects, cases, launches and operators..."
              className="w-full bg-transparent text-[13px] text-text outline-none placeholder:text-sub"
              aria-label="Search portal"
            />
          </label>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {memberships.length > 0 ? (
              <div className="rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">Workspace</p>
                <select
                  value={activeProjectId ?? ""}
                  onChange={(event) => setActiveProjectId(event.target.value)}
                  className="mt-1 min-w-[170px] bg-transparent text-[13px] font-semibold text-text outline-none"
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
              </div>
            ) : null}

            {primaryAccount ? (
              <div className="rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">Account</p>
                <p className="mt-1 text-[13px] font-semibold text-text">{primaryAccount.name}</p>
              </div>
            ) : null}

            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-sub transition hover:border-white/12 hover:bg-white/[0.05] hover:text-text"
              aria-label="Notifications"
            >
              <Bell size={15} />
            </button>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/16 bg-emerald-400/10 px-3 py-2 md:flex">
              <Zap size={13} className="text-emerald-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                Stable
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[11px] font-black uppercase text-primary">
                {identityLabel.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-text">{email || "admin@portal.com"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <ShieldCheck size={11} className="text-primary" />
                  <p className="text-[9px] uppercase tracking-[0.14em] text-primary">{statusLabel}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-sub transition hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-text"
              aria-label="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
