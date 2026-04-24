"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AccountEntryGuard from "@/components/accounts/AccountEntryGuard";
import AdminSidebar from "@/components/layout/sidebar/AdminSidebar";
import AdminHeader from "@/components/layout/header/AdminHeader";
import { LoadingState } from "@/components/layout/state/StatePrimitives";
import { fetchCurrentPortalSecurityAccount } from "@/lib/security/security-actions";
import { derivePortalSecurityRequirements } from "@/lib/security/security-contract";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import type { PortalSecurityCurrentAccount } from "@/types/entities/security";

type Props = {
  children: ReactNode;
};

export default function AdminShell({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const mfaPending = useAdminAuthStore((s) => s.mfaPending);
  const authLoading = useAdminAuthStore((s) => s.loading);
  const initialize = useAdminAuthStore((s) => s.initialize);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const role = useAdminAuthStore((s) => s.role);
  const authUserId = useAdminAuthStore((s) => s.authUserId);

  const hydrated = useAdminPortalStore((s) => s.hydrated);
  const dataLoading = useAdminPortalStore((s) => s.loading);
  const scopedProjectId = useAdminPortalStore((s) => s.scopedProjectId);
  const loadAll = useAdminPortalStore((s) => s.loadAll);
  const [securityCurrent, setSecurityCurrent] = useState<PortalSecurityCurrentAccount | null>(null);
  const [securityLoading, setSecurityLoading] = useState(true);

  useEffect(() => {
    void initialize().catch((error) => {
      console.error("Failed to initialize admin auth state:", error);
      useAdminAuthStore.setState({
        ...{
          isAuthenticated: false,
          authUserId: null,
          email: null,
          role: null,
          memberships: [],
          activeProjectId: null,
          currentAal: null,
          nextAal: null,
          authMethod: "unknown",
          verifiedFactorCount: 0,
          mfaPending: false,
          loading: false,
        },
      });
    });
  }, [initialize]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || mfaPending)) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, mfaPending, router]);

  useEffect(() => {
    if (authLoading) {
      setSecurityLoading(true);
      return;
    }

    if (!isAuthenticated || !authUserId) {
      setSecurityCurrent(null);
      setSecurityLoading(false);
      return;
    }

    let active = true;

    void fetchCurrentPortalSecurityAccount()
      .then((current) => {
        if (!active) {
          return;
        }

        setSecurityCurrent(current);
        setSecurityLoading(false);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        console.error("Failed to resolve current portal security posture:", error);
        setSecurityCurrent(null);
        setSecurityLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, authUserId, isAuthenticated, pathname]);

  const securityRequirements = derivePortalSecurityRequirements({
    membershipRole: securityCurrent?.membershipRole,
    policy: securityCurrent?.policy ?? null,
    userPosture: securityCurrent?.userPosture ?? null,
  });
  const blockedBySecurity =
    Boolean(securityCurrent?.customerAccountId) &&
    (securityRequirements.blockedBySso || securityRequirements.blockedByTwoFactor);
  const securitySettingsRoute = pathname.startsWith("/settings/security");

  useEffect(() => {
    if (!blockedBySecurity || securityLoading || securitySettingsRoute) {
      return;
    }

    const reason = securityRequirements.blockedBySso ? "sso" : "two-factor";
    router.replace(`/settings/security?enforcement=${reason}`);
  }, [
    blockedBySecurity,
    securityLoading,
    securitySettingsRoute,
    router,
    securityRequirements.blockedBySso,
  ]);

  useEffect(() => {
    const needsProjectScope = role !== "super_admin";
    const canLoad =
      isAuthenticated &&
      !blockedBySecurity &&
      !securityLoading &&
      (!needsProjectScope || !!activeProjectId);
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
  }, [
    isAuthenticated,
    blockedBySecurity,
    hydrated,
    dataLoading,
    loadAll,
    activeProjectId,
    scopedProjectId,
    role,
    pathname,
    securityLoading,
  ]);

  if (authLoading || securityLoading || (!hydrated && dataLoading && !blockedBySecurity)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6 text-text">
        <div className="w-full max-w-2xl">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || mfaPending) return null;
  if (blockedBySecurity && !securitySettingsRoute) return null;

  return (
    <AccountEntryGuard>
      <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,rgba(123,92,255,0.08),transparent_18%),linear-gradient(180deg,rgba(4,6,8,1),rgba(3,4,6,1))] text-text">
        <AdminSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1820px] px-4 py-6 pb-10 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </AccountEntryGuard>
  );
}
