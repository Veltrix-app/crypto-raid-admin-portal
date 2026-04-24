"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { cn } from "@/lib/utils/cn";
import { GLOBAL_NAV_ITEMS } from "@/lib/navigation/portal-nav";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

export default function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const { memberships, activeProjectId, role } = useAdminAuthStore();
  const { accessState } = useAccountEntryGuard();
  const activeWorkspace = memberships.find((item) => item.projectId === activeProjectId);
  const navItems = accessState?.limitedNav
    ? GLOBAL_NAV_ITEMS.filter(
        (item) =>
          item.href === "/getting-started" ||
          (item.href === "/account" && Boolean(accessState.primaryAccount))
      )
    : GLOBAL_NAV_ITEMS.filter((item) => !item.superAdminOnly || role === "super_admin");

  return (
    <aside className="sticky top-0 hidden h-screen w-[74px] shrink-0 border-r border-white/6 bg-[linear-gradient(180deg,rgba(8,10,14,0.99),rgba(5,7,10,0.995))] px-2 py-3 lg:flex lg:flex-col">
      <Link
        href="/overview"
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-[14px] border border-primary/18 bg-[linear-gradient(180deg,rgba(186,255,59,0.14),rgba(255,255,255,0.02))] text-primary shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
        title="Veltrix portal"
        aria-label="Veltrix portal"
      >
        <Shield size={16} />
      </Link>

      <nav className="mt-4 flex-1 overflow-y-auto">
        <p className="mb-2 text-center text-[8px] font-bold uppercase tracking-[0.18em] text-sub">
          Nav
        </p>
        <div className="flex flex-col items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={cn(
                  "group relative flex h-10 w-10 items-center justify-center rounded-[14px] border transition",
                  active
                    ? "border-primary/24 bg-primary/12 text-primary shadow-[0_12px_28px_rgba(186,255,59,0.12)]"
                    : "border-transparent bg-transparent text-sub hover:border-white/10 hover:bg-white/[0.04] hover:text-text"
                )}
              >
                {active ? (
                  <span className="absolute -left-[9px] top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                ) : null}
                <Icon size={16} />
                <span
                  className={cn(
                    "pointer-events-none absolute left-[calc(100%+0.55rem)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-2 py-1 text-[9px] font-semibold opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition group-hover:opacity-100 group-focus-visible:opacity-100",
                    active
                      ? "border-primary/20 bg-[#0d1117] text-primary"
                      : "border-white/8 bg-[#0d1117] text-text"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="space-y-2.5">
        <div
          className="rounded-[14px] border border-white/6 bg-white/[0.03] px-2 py-2.5 text-center"
          title={activeWorkspace?.projectName || accessState?.primaryAccount?.name || "Workspace"}
        >
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-sub">WS</p>
          <p className="mt-1 truncate text-[12px] font-semibold text-text">
            {(activeWorkspace?.projectName || accessState?.primaryAccount?.name || "W").slice(0, 1)}
          </p>
        </div>

        <div
          className="mx-auto h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.55)]"
          title="Portal stable"
        />
      </div>
    </aside>
  );
}
