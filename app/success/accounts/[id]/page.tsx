"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { SuccessAccountDetail } from "@/components/success/SuccessAccountDetail";
import type { AdminSuccessAccountDetail } from "@/types/entities/success";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function SuccessAccountPage({ params }: PageProps) {
  const [accountId, setAccountId] = useState<string>("");
  const [detail, setDetail] = useState<AdminSuccessAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((resolved) => setAccountId(resolved.id));
  }, [params]);

  async function loadDetail(nextAccountId: string) {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/success/accounts/${nextAccountId}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; detail?: AdminSuccessAccountDetail; error?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.detail) {
        throw new Error(payload?.error ?? "Failed to load success account detail.");
      }

      setDetail(payload.detail);
    } catch (nextError) {
      setDetail(null);
      setError(nextError instanceof Error ? nextError.message : "Failed to load success account detail.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!accountId) {
      return;
    }

    void loadDetail(accountId);
  }, [accountId]);

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Success account"
        title={detail ? detail.accountName : "Success account"}
        description="Drill into one workspace account with its activation posture, derived signals, member health read and follow-up layer."
      >
        {loading ? (
          <div className="rounded-[22px] border border-line bg-card2 px-4 py-4 text-sm text-sub">
            Loading success account...
          </div>
        ) : error ? (
          <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
            {error}
          </div>
        ) : detail ? (
          <SuccessAccountDetail detail={detail} onRefresh={() => loadDetail(accountId)} />
        ) : null}
      </PortalPageFrame>
    </AdminShell>
  );
}
