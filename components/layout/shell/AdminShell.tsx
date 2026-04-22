"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AccountEntryGuard from "@/components/accounts/AccountEntryGuard";
import AdminSidebar from "@/components/layout/sidebar/AdminSidebar";
import AdminHeader from "@/components/layout/header/AdminHeader";
import { LoadingState } from "@/components/layout/state/StatePrimitives";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type Props = {
  children: ReactNode;
};

export default function AdminShell({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";

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
    void initialize().catch((error) => {
      console.error("Failed to initialize admin auth state:", error);
      useAdminAuthStore.setState({
        isAuthenticated: false,
        authUserId: null,
        email: null,
        role: null,
        memberships: [],
        activeProjectId: null,
        loading: false,
      });
    });
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
      void loadAll().catch((error) => {
        console.error("Failed to hydrate admin portal store:", error);
        useAdminPortalStore.setState({
          hydrated: true,
          loading: false,
          scopedProjectId: activeProjectId,
        });
      });
    }
  }, [isAuthenticated, hydrated, dataLoading, loadAll, activeProjectId, scopedProjectId, role, pathname]);

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

  return (
    <AccountEntryGuard>
      <div className="flex min-h-screen bg-bg text-text">
        <AdminSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(186,255,59,0.04),transparent_18%),linear-gradient(180deg,rgba(7,10,15,0.72),rgba(7,10,15,0.32))]">
            <div className="mx-auto w-full max-w-[1680px] px-6 py-6 pb-10">{children}</div>
          </main>
        </div>
      </div>
    </AccountEntryGuard>
  );
}
