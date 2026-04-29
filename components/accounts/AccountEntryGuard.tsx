"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingState } from "@/components/layout/state/StatePrimitives";
import {
  derivePortalAccountAccessState,
  fetchPortalAccountOverview,
  type PortalAccountAccessState,
  type PortalCustomerAccountOverview,
} from "@/lib/accounts/account-onboarding";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

type AccountEntryGuardContextValue = {
  loading: boolean;
  error: string | null;
  overview: PortalCustomerAccountOverview | null;
  accessState: PortalAccountAccessState | null;
  refresh: () => Promise<void>;
};

const AccountEntryGuardContext = createContext<AccountEntryGuardContextValue | null>(null);
const fallbackAccountEntryGuardContext: AccountEntryGuardContextValue = {
  loading: false,
  error: null,
  overview: null,
  accessState: null,
  refresh: async () => {},
};

export function useAccountEntryGuard() {
  const context = useContext(AccountEntryGuardContext);
  if (!context) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("useAccountEntryGuard resolved without provider; returning fallback state.");
    }

    return fallbackAccountEntryGuardContext;
  }

  return context;
}

export default function AccountEntryGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const role = useAdminAuthStore((s) => s.role);
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const authUserId = useAdminAuthStore((s) => s.authUserId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<PortalCustomerAccountOverview | null>(null);

  const loadOverview = useCallback(async () => {
    if (!authUserId || !isAuthenticated) {
      setOverview(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const nextOverview = await fetchPortalAccountOverview();
      setOverview(nextOverview);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load account entry.");
    } finally {
      setLoading(false);
    }
  }, [authUserId, isAuthenticated]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const accessState = useMemo(
    () =>
      derivePortalAccountAccessState({
        pathname,
        overview,
        isSuperAdmin: role === "super_admin",
      }),
    [overview, pathname, role]
  );

  useEffect(() => {
    if (loading || !accessState?.shouldRedirectToGettingStarted) {
      return;
    }

    router.replace("/getting-started");
  }, [accessState?.shouldRedirectToGettingStarted, loading, router]);

  const contextValue = useMemo(
    () => ({
      loading,
      error,
      overview,
      accessState,
      refresh: loadOverview,
    }),
    [accessState, error, loading, loadOverview, overview]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6 text-text">
        <div className="w-full max-w-2xl">
          <LoadingState
            title="Loading account setup"
            description="VYNTRO is resolving workspace memberships, onboarding state and the right portal entry surface."
          />
        </div>
      </div>
    );
  }

  return (
    <AccountEntryGuardContext.Provider value={contextValue}>
      {children}
    </AccountEntryGuardContext.Provider>
  );
}
