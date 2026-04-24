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
    <aside className="sticky top-0 hidden h-screen w-[82px] shrink-0 border-r border-white/6 bg-[linear-gradient(180deg,rgba(8,10,14,0.98),rgba(5,7,10,0.99))] px-2.5 py-4 lg:flex lg:flex-col">
      <Link
        href="/overview"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] border border-primary/18 bg-[linear-gradient(180deg,rgba(186,255,59,0.14),rgba(255,255,255,0.02))] text-primary shadow-[0_18px_48px_rgba(0,0,0,0.28)]"
        title="Veltrix portal"
        aria-label="Veltrix portal"
      >
        <Shield size={18} />
      </Link>

      <nav className="mt-5 flex-1 overflow-y-auto">
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
                  "flex h-11 w-11 items-center justify-center rounded-[16px] border transition",
                  active
                    ? "border-primary/24 bg-primary/12 text-primary shadow-[0_16px_42px_rgba(186,255,59,0.12)]"
                    : "border-transparent bg-transparent text-sub hover:border-white/10 hover:bg-white/[0.04] hover:text-text"
                )}
              >
                <Icon size={17} />
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="space-y-2.5">
        <div
          className="rounded-[16px] border border-white/6 bg-white/[0.03] px-2.5 py-3 text-center"
          title={activeWorkspace?.projectName || accessState?.primaryAccount?.name || "Workspace"}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">WS</p>
          <p className="mt-1.5 truncate text-[13px] font-semibold text-text">
            {(activeWorkspace?.projectName || accessState?.primaryAccount?.name || "W").slice(0, 1)}
          </p>
        </div>

        <div className="mx-auto h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.55)]" title="Portal stable" />
      </div>
    </aside>
  );
}
