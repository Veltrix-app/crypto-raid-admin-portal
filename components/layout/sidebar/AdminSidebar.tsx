"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Shield } from "lucide-react";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { cn } from "@/lib/utils/cn";
import { GLOBAL_NAV_ITEMS, isLegacySecondaryRoute } from "@/lib/navigation/portal-nav";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminUIStore } from "@/store/ui/useAdminUIStore";

export default function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const sidebarCollapsed = useAdminUIStore((s) => s.sidebarCollapsed);
  const { memberships, activeProjectId, role } = useAdminAuthStore();
  const { accessState } = useAccountEntryGuard();
  const activeWorkspace = memberships.find((item) => item.projectId === activeProjectId);
  const showLegacyNotice = isLegacySecondaryRoute(pathname);
  const navItems = accessState?.limitedNav
    ? GLOBAL_NAV_ITEMS.filter(
        (item) =>
          item.href === "/getting-started" ||
          (item.href === "/account" && Boolean(accessState.primaryAccount))
      )
    : GLOBAL_NAV_ITEMS.filter((item) => !item.superAdminOnly || role === "super_admin");

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-[radial-gradient(circle_at_top_left,rgba(186,255,59,0.10),transparent_18%),linear-gradient(180deg,rgba(8,11,17,0.98),rgba(7,9,13,0.98))] px-4 py-5 shadow-[16px_0_60px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all",
        sidebarCollapsed ? "w-[108px]" : "w-[300px]"
      )}
    >
      <div
        className={cn(
        "rounded-[28px] border border-line bg-[linear-gradient(180deg,rgba(18,26,38,0.84),rgba(13,19,29,0.92))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)]",
          sidebarCollapsed && "px-3"
        )}
      >
        <div className={cn("flex items-start gap-3", sidebarCollapsed && "justify-center")}>
          <div className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-primary/30 bg-primary/10 text-primary shadow-[0_0_24px_rgba(186,255,59,0.18)]">
            <Shield size={20} />
          </div>

          {!sidebarCollapsed ? (
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                Veltrix Platform
              </p>
              <h2 className="mt-2 text-lg font-extrabold tracking-tight text-text">
                Launch Control
              </h2>
              <p className="mt-1 text-sm text-sub">
                Project-first launch operations, community control and safety workflows.
              </p>
            </div>
          ) : null}
        </div>

        {!sidebarCollapsed ? (
          <div className="mt-4 rounded-[22px] border border-line bg-black/20 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sub">
              Live workspace
            </p>
            <p className="mt-2 truncate text-sm font-bold text-text">
              {activeWorkspace?.projectName || accessState?.primaryAccount?.name || "Workspace not selected"}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-primary">
              {role === "super_admin"
                ? "Super admin"
                : accessState?.primaryAccount?.role || activeWorkspace?.role || "Project operator"}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
        {!sidebarCollapsed ? (
          <div className="px-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sub">Portal</p>
          </div>
        ) : null}

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-[22px] border px-4 py-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  active
                    ? "border-primary/30 bg-[linear-gradient(90deg,rgba(186,255,59,0.18),rgba(18,24,39,0.92))] text-text shadow-[0_0_0_1px_rgba(186,255,59,0.08)]"
                    : "border-transparent text-sub hover:border-white/10 hover:bg-white/[0.04] hover:text-text",
                  sidebarCollapsed && "justify-center px-0"
                )}
                title={item.label}
                aria-label={item.label}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[16px] transition",
                    active
                      ? "bg-primary/12 text-primary"
                      : "bg-white/[0.03] text-sub group-hover:text-text"
                  )}
                >
                  <Icon size={18} />
                </div>

                {!sidebarCollapsed ? (
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-semibold", active ? "text-text" : "text-inherit")}>
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-sub">{item.description}</p>
                  </div>
                ) : null}

                {!sidebarCollapsed && active ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_16px_rgba(186,255,59,0.6)]" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {accessState?.limitedNav && !sidebarCollapsed ? (
          <div className="rounded-[24px] border border-primary/20 bg-primary/8 px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              First-run mode
            </p>
            <p className="mt-2 text-sm font-semibold text-text">
              Complete the account setup rail before the full portal navigation opens.
            </p>
            <p className="mt-2 text-sm leading-6 text-sub">
              This keeps new workspaces focused on the next safe move instead of dropping them into every operator surface at once.
            </p>
          </div>
        ) : null}

        {showLegacyNotice && !sidebarCollapsed ? (
          <div className="rounded-[24px] border border-line bg-[linear-gradient(180deg,rgba(18,26,38,0.84),rgba(13,19,29,0.92))] px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sub">
              Legacy route
            </p>
            <p className="mt-2 text-sm font-semibold text-text">
              This surface stays reachable during migration.
            </p>
            <p className="mt-2 text-sm leading-6 text-sub">
              For new project-scoped work, jump back into the Projects workspace and use the dedicated subnav.
            </p>
            <Link
              href="/projects"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              Open Projects
              <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-[24px] border border-line bg-[linear-gradient(180deg,rgba(18,26,38,0.84),rgba(13,19,29,0.92))] px-4 py-4">
        {!sidebarCollapsed ? (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sub">
              System mode
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-text">Public launch mode</span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                Stable
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-center">
            <span
              className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.55)]"
              aria-label="Portal stable"
              title="Portal stable"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
