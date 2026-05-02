"use client";

import { useMemo, useState } from "react";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { formatSecurityLabel } from "@/lib/security/security-contract";
import type { PortalSecurityCurrentAccount } from "@/types/entities/security";

export function SsoConfigurationPanel({
  current,
  onSave,
  saving,
}: {
  current: PortalSecurityCurrentAccount;
  onSave: (input: {
    policy: {
      ssoRequired: boolean;
      twoFactorRequiredForAdmins: boolean;
      sessionReviewRequired: boolean;
      highRiskReauthRequired: boolean;
      securityContactEmail: string;
      notes: string;
    };
    sso: {
      providerLabel: string;
      supabaseProviderId?: string | null;
      domains: string[];
      enabled: boolean;
    };
  }) => Promise<void> | void;
  saving?: boolean;
}) {
  const firstConnection = current.ssoConnections[0];
  const [providerLabel, setProviderLabel] = useState(firstConnection?.providerLabel ?? "");
  const [providerId, setProviderId] = useState(firstConnection?.supabaseProviderId ?? "");
  const [domains, setDomains] = useState(
    firstConnection?.domains.map((domain) => domain.domain).join(", ") ?? ""
  );
  const [ssoRequired, setSsoRequired] = useState(current.policy?.ssoRequired ?? false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(
    current.policy?.twoFactorRequiredForAdmins ?? false
  );
  const [sessionReviewRequired, setSessionReviewRequired] = useState(
    current.policy?.sessionReviewRequired ?? false
  );
  const [highRiskReauthRequired, setHighRiskReauthRequired] = useState(
    current.policy?.highRiskReauthRequired ?? false
  );
  const [securityContactEmail, setSecurityContactEmail] = useState(
    current.policy?.securityContactEmail ?? ""
  );
  const [notes, setNotes] = useState(current.policy?.notes ?? "");

  const cleanedDomains = useMemo(
    () =>
      domains
        .split(",")
        .map((domain) => domain.trim().toLowerCase())
        .filter((domain) => domain.length > 0),
    [domains]
  );

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    await onSave({
      policy: {
        ssoRequired,
        twoFactorRequiredForAdmins: twoFactorRequired,
        sessionReviewRequired,
        highRiskReauthRequired,
        securityContactEmail,
        notes,
      },
      sso: {
        providerLabel,
        supabaseProviderId: providerId || null,
        domains: cleanedDomains,
        enabled: Boolean(providerLabel.trim() && cleanedDomains.length > 0 && ssoRequired),
      },
    });
  }

  return (
    <OpsPanel
      eyebrow="Enterprise identity"
      title="SSO and enterprise policy"
      description="Store the active SAML provider reference, verified domains and the policy posture that should be enforced inside the portal."
    >
      <div className="mb-3.5 flex flex-wrap gap-2">
        <OpsStatusPill tone={current.policy?.ssoRequired ? "warning" : "default"}>
          {current.policy?.ssoRequired ? "SSO required" : "SSO optional"}
        </OpsStatusPill>
        <OpsStatusPill tone={current.policy?.twoFactorRequiredForAdmins ? "warning" : "default"}>
          {current.policy?.twoFactorRequiredForAdmins ? "2FA enforced for owner/admin" : "2FA optional"}
        </OpsStatusPill>
        {firstConnection?.status ? (
          <OpsStatusPill>{formatSecurityLabel(firstConnection.status)}</OpsStatusPill>
        ) : null}
      </div>

      <form onSubmit={handleSave} className="space-y-3.5">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={providerLabel}
            onChange={(event) => setProviderLabel(event.target.value)}
            placeholder="Provider label"
            className="rounded-[16px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-2.5 text-[13px] text-text placeholder:text-sub/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={providerId}
            onChange={(event) => setProviderId(event.target.value)}
            placeholder="Supabase provider ID"
            className="rounded-[16px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-2.5 text-[13px] text-text placeholder:text-sub/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <textarea
          value={domains}
          onChange={(event) => setDomains(event.target.value)}
          placeholder="Allowed domains, comma separated"
          rows={3}
          className="w-full rounded-[16px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-2.5 text-[13px] text-text placeholder:text-sub/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={securityContactEmail}
            onChange={(event) => setSecurityContactEmail(event.target.value)}
            placeholder="Security contact email"
            className="rounded-[16px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-2.5 text-[13px] text-text placeholder:text-sub/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Policy notes"
            rows={3}
            className="rounded-[16px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-2.5 text-[13px] text-text placeholder:text-sub/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center gap-2.5 rounded-[16px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-2.5 text-[13px] text-text">
            <input type="checkbox" checked={ssoRequired} onChange={(event) => setSsoRequired(event.target.checked)} />
            Require SSO
          </label>
          <label className="flex items-center gap-2.5 rounded-[16px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-2.5 text-[13px] text-text">
            <input type="checkbox" checked={twoFactorRequired} onChange={(event) => setTwoFactorRequired(event.target.checked)} />
            Enforce 2FA
          </label>
          <label className="flex items-center gap-2.5 rounded-[16px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-2.5 text-[13px] text-text">
            <input type="checkbox" checked={sessionReviewRequired} onChange={(event) => setSessionReviewRequired(event.target.checked)} />
            Review sessions
          </label>
          <label className="flex items-center gap-2.5 rounded-[16px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-2.5 text-[13px] text-text">
            <input type="checkbox" checked={highRiskReauthRequired} onChange={(event) => setHighRiskReauthRequired(event.target.checked)} />
            High-risk reauth
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-black transition hover:brightness-105 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save security policy"}
        </button>
      </form>
    </OpsPanel>
  );
}
