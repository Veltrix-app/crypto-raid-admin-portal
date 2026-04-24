"use client";

import { Bell, LogOut, Search, ShieldCheck } from "lucide-react";
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
    <header className="sticky top-0 z-30 border-b border-white/6 bg-[#06080b]/92 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1760px] px-3 py-2.5 sm:px-5 lg:px-6">
        <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_minmax(220px,300px)_auto] xl:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-sub">
                {pageMeta.eyebrow}
              </p>
              {primaryAccount ? (
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-sub">
                  {primaryAccount.name}
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-2.5">
              <h1 className="truncate text-[0.95rem] font-semibold tracking-[-0.02em] text-text sm:text-[1.02rem]">
                {pageMeta.title}
              </h1>
              <span className="hidden truncate text-[11px] text-sub xl:inline">
                {pageMeta.description}
              </span>
            </div>
          </div>

          <label className="flex min-w-0 items-center gap-2.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
            <Search size={14} className="text-sub" />
            <input
              placeholder="Search portal..."
              className="w-full bg-transparent text-[12px] text-text outline-none placeholder:text-sub"
              aria-label="Search portal"
            />
          </label>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {memberships.length > 0 ? (
              <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-sub">
                  Workspace
                </p>
                <select
                  value={activeProjectId ?? ""}
                  onChange={(event) => setActiveProjectId(event.target.value)}
                  className="mt-0.5 min-w-[148px] bg-transparent text-[12px] font-semibold text-text outline-none"
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

            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-sub transition hover:border-white/12 hover:bg-white/[0.05] hover:text-text"
              aria-label="Notifications"
            >
              <Bell size={14} />
            </button>

            <div className="flex items-center gap-2.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[10px] font-black uppercase text-primary">
                {identityLabel.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-text">
                  {email || "admin@portal.com"}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck size={10} className="text-primary" />
                  <p className="truncate text-[8px] uppercase tracking-[0.12em] text-primary">
                    {statusLabel}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-sub transition hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-text"
              aria-label="Log out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
