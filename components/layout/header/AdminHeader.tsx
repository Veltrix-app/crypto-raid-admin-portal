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
    <header className="sticky top-0 z-30 border-b border-white/[0.018] bg-[#06080b]/90 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1760px] px-3 py-2 sm:px-5 lg:px-6">
        <div className="grid gap-2.5 xl:grid-cols-[minmax(160px,0.7fr)_minmax(220px,320px)_auto] xl:items-center">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-[8px] font-black uppercase tracking-[0.18em] text-sub/75">
                {pageMeta.eyebrow}
              </p>
              <span className="hidden h-1 w-1 shrink-0 rounded-full bg-white/18 sm:block" />
              <p className="truncate text-[11px] font-semibold tracking-[-0.01em] text-text/90">
                {pageMeta.title}
              </p>
            </div>
            {primaryAccount ? (
              <p className="mt-0.5 truncate text-[10px] font-medium text-sub/70">
                {primaryAccount.name}
              </p>
            ) : (
              <p className="mt-0.5 hidden truncate text-[10px] font-medium text-sub/70 xl:block">
                {pageMeta.description}
              </p>
            )}
          </div>

          <label className="flex min-w-0 items-center gap-2.5 rounded-full border border-white/[0.024] bg-white/[0.012] px-3 py-2">
            <Search size={14} className="text-sub" />
            <input
              placeholder="Search portal..."
              className="w-full bg-transparent text-[12px] text-text outline-none placeholder:text-sub/65"
              aria-label="Search portal"
            />
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {memberships.length > 0 ? (
              <div className="rounded-full border border-white/[0.024] bg-white/[0.012] px-3 py-1.5">
                <p className="text-[7px] font-black uppercase tracking-[0.14em] text-sub/75">
                  Workspace
                </p>
                <select
                  value={activeProjectId ?? ""}
                  onChange={(event) => setActiveProjectId(event.target.value)}
                  className="mt-0.5 min-w-[136px] bg-transparent text-[11px] font-semibold text-text outline-none"
                  aria-label="Switch active workspace"
                >
                  {memberships.map((membership) => (
                    <option
                      key={membership.projectId}
                      value={membership.projectId}
                      className="bg-white/[0.012] text-text"
                    >
                      {membership.projectName}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.024] bg-white/[0.012] text-sub transition hover:border-white/10 hover:bg-white/[0.04] hover:text-text"
              aria-label="Notifications"
            >
              <Bell size={14} />
            </button>

            <div className="flex items-center gap-2.5 rounded-full border border-white/[0.024] bg-white/[0.012] px-3 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/[0.055] text-[10px] font-black uppercase text-primary">
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
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.024] bg-white/[0.012] text-sub transition hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-text"
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
