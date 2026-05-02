"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { cn } from "@/lib/utils/cn";
import { GLOBAL_NAV_GROUPS, GLOBAL_NAV_ITEMS } from "@/lib/navigation/portal-nav";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

const SIDEBAR_STORAGE_KEY = "vyntro-portal-sidebar-expanded";

export default function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const { memberships, activeProjectId, role } = useAdminAuthStore();
  const { accessState } = useAccountEntryGuard();
  const [expanded, setExpanded] = useState(true);
  const activeWorkspace = memberships.find((item) => item.projectId === activeProjectId);
  const workspaceName = activeWorkspace?.projectName || accessState?.primaryAccount?.name || "Workspace";
  const navItems = accessState?.limitedNav
    ? GLOBAL_NAV_ITEMS.filter(
        (item) =>
          item.href === "/getting-started" ||
          (item.href === "/account" && Boolean(accessState.primaryAccount))
      )
    : GLOBAL_NAV_ITEMS.filter((item) => !item.superAdminOnly || role === "super_admin");

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setExpanded(stored === "true");
    }
  }, []);

  function toggleExpanded() {
    setExpanded((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r border-white/[0.026] bg-[linear-gradient(180deg,rgba(8,10,14,0.99),rgba(5,7,10,0.995))] px-2.5 py-3 transition-[width] duration-300 lg:flex lg:flex-col",
        expanded ? "w-[246px]" : "w-[82px]"
      )}
    >
      <div className={cn("gap-2", expanded ? "flex items-center" : "flex flex-col items-center")}>
        <Link
          href="/overview"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-primary/20 bg-[linear-gradient(180deg,rgba(186,255,59,0.16),rgba(255,255,255,0.025))] text-primary shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
          title="VYNTRO portal"
          aria-label="VYNTRO portal"
        >
          <Shield size={16} />
        </Link>

        {expanded ? (
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/80">
              VYNTRO
            </p>
            <p className="mt-0.5 truncate text-[13px] font-semibold text-text">
              Portal OS
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={toggleExpanded}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-[13px] border border-white/[0.032] bg-white/[0.018] text-sub transition hover:border-primary/20 hover:bg-primary/[0.055] hover:text-primary",
            expanded ? "h-9 w-9" : "h-8 w-12"
          )}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          title={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      <nav className="portal-sidebar-scroll mt-4 flex-1 overflow-y-auto pr-0.5">
        <div className="flex flex-col gap-4">
          {GLOBAL_NAV_GROUPS.map((group) => {
            const groupItems = navItems.filter((item) => item.group === group.key);

            if (groupItems.length === 0) {
              return null;
            }

            return (
              <div key={group.key}>
                <p
                  className={cn(
                    "mb-1.5 text-[7px] font-black uppercase tracking-[0.2em] text-sub/70",
                    expanded ? "px-2 text-left" : "text-center"
                  )}
                >
                  {group.label}
                </p>
                <div className="flex flex-col gap-1.5">
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    const href =
                      item.requiresWorkspace && activeProjectId
                        ? item.href.replace(":projectId", activeProjectId)
                        : item.requiresWorkspace
                          ? "/projects"
                          : item.href;
                    const active =
                      item.href === "/projects"
                        ? pathname === "/projects" ||
                          pathname === "/projects/new" ||
                          /^\/projects\/[^/]+$/.test(pathname)
                        : pathname === href || pathname.startsWith(`${href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={href}
                        title={item.label}
                        aria-label={item.label}
                        className={cn(
                          "group relative flex min-w-0 items-center rounded-[14px] border transition",
                          expanded
                            ? "h-10 w-full justify-start gap-2.5 px-2.5"
                            : "mx-auto h-10 w-10 justify-center",
                          active
                            ? "border-primary/22 bg-[linear-gradient(90deg,rgba(186,255,59,0.13),rgba(255,255,255,0.028))] text-primary shadow-[0_12px_28px_rgba(186,255,59,0.09)]"
                            : "border-transparent bg-transparent text-sub hover:border-white/[0.055] hover:bg-white/[0.032] hover:text-text"
                        )}
                      >
                        {active ? (
                          <span
                            className={cn(
                              "absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary",
                              expanded ? "left-0" : "-left-[11px]"
                            )}
                          />
                        ) : null}
                        <Icon size={15} className="shrink-0" />
                        {expanded ? (
                          <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                            {item.label}
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "pointer-events-none absolute left-[calc(100%+0.55rem)] top-1/2 z-40 -translate-y-1/2 whitespace-nowrap rounded-full border px-2 py-1 text-[9px] font-semibold opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition group-hover:opacity-100 group-focus-visible:opacity-100",
                              active
                                ? "border-primary/20 bg-[#0d1117] text-primary"
                                : "border-white/[0.032] bg-[#0d1117] text-text"
                            )}
                          >
                            {item.label}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="space-y-2.5">
        <div
          className={cn(
            "rounded-[16px] border border-white/[0.045] bg-white/[0.016] px-2 py-2.5",
            expanded ? "text-left" : "text-center"
          )}
          title={workspaceName}
        >
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-sub">
            {expanded ? "Workspace" : "WS"}
          </p>
          <p className="mt-1 truncate text-[12px] font-semibold text-text">
            {expanded ? workspaceName : workspaceName.slice(0, 1)}
          </p>
          {expanded ? (
            <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/80">
              {role === "super_admin" ? "Super admin" : "Project admin"}
            </p>
          ) : null}
        </div>

        <div className={cn("flex items-center gap-2", expanded ? "px-2" : "justify-center")}>
          <div
            className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.55)]"
            title="Portal stable"
          />
          {expanded ? (
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sub">
              Portal stable
            </span>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
