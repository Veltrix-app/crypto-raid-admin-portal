"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/layout/sidebar/AdminSidebar";
import AdminHeader from "@/components/layout/header/AdminHeader";
import { EmptyState, LoadingState } from "@/components/layout/state/StatePrimitives";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type Props = {
  children: ReactNode;
};

export default function AdminShell({ children }: Props) {
  const router = useRouter();

  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const authLoading = useAdminAuthStore((s) => s.loading);
  const initialize = useAdminAuthStore((s) => s.initialize);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const role = useAdminAuthStore((s) => s.role);

  const hydrated = useAdminPortalStore((s) => s.hydrated);
  const dataLoading = useAdminPortalStore((s) => s.loading);
  const scopedProjectId = useAdminPortalStore((s) => s.scopedProjectId);
  const loadAll = useAdminPortalStore((s) => s.loadAll);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const needsProjectScope = role !== "super_admin";
    const canLoad = isAuthenticated && (!needsProjectScope || !!activeProjectId);
    const scopeChanged = hydrated && scopedProjectId !== activeProjectId;

    if (canLoad && (!hydrated || scopeChanged) && !dataLoading) {
      loadAll();
    }
  }, [isAuthenticated, hydrated, dataLoading, loadAll, activeProjectId, scopedProjectId, role]);

  if (authLoading || (!hydrated && dataLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6 text-text">
        <div className="w-full max-w-2xl">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (role !== "super_admin" && !activeProjectId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6 text-text">
        <div className="w-full max-w-2xl">
          <EmptyState
            title="No workspace is linked to this account yet"
            description="This account is authenticated, but it still needs at least one project membership before the portal can open a scoped operator workspace."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <AdminSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(186,255,59,0.04),transparent_18%),linear-gradient(180deg,rgba(7,10,15,0.72),rgba(7,10,15,0.32))]">
          <div className="mx-auto w-full max-w-[1680px] px-6 py-6 pb-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
