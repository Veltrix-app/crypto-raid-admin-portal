"use client";

import { Link2, RefreshCcw, ShieldAlert, Siren } from "lucide-react";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

export default function ProviderHealthPanel({
  providerFailureCount,
  automationFailureCount,
  activeOverrideCount,
  snapshotStale,
}: {
  providerFailureCount: number;
  automationFailureCount: number;
  activeOverrideCount: number;
  snapshotStale: boolean;
}) {
  const tone =
    providerFailureCount > 0 || automationFailureCount > 0 || snapshotStale
      ? "warning"
      : "success";

  return (
    <OpsPanel
      eyebrow="Health rail"
      title="Provider and automation health"
      description="The fast read on delivery, sync, cadence, and operator override pressure."
      action={<OpsStatusPill tone={tone}>{tone === "success" ? "Stable" : "Attention"}</OpsStatusPill>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <SignalCard
          icon={<Siren size={16} />}
          label="Provider failures"
          value={providerFailureCount}
          description="Fresh provider and webhook failures still needing intervention."
          tone={providerFailureCount > 0 ? "warning" : "success"}
        />
        <SignalCard
          icon={<RefreshCcw size={16} />}
          label="Automation failures"
          value={automationFailureCount}
          description="Failed automation runs across community, sync, and routine ops rails."
          tone={automationFailureCount > 0 ? "warning" : "success"}
        />
        <SignalCard
          icon={<ShieldAlert size={16} />}
          label="Active overrides"
          value={activeOverrideCount}
          description="Manual kill switches or temporary overrides still active in the system."
          tone={activeOverrideCount > 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-5 rounded-[18px] border border-white/[0.032] bg-black/20 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.018] text-primary">
            <Link2 size={16} />
          </div>
          <div>
            <p className="font-bold text-text">What to do when this rail moves</p>
            <p className="mt-2 text-sm leading-6 text-sub">
              Provider failures usually land in `On-chain`, `Community`, or `Claims`. Overrides are the
              signal to confirm a temporary workaround is still justified.
            </p>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}

function SignalCard({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  tone: "warning" | "success";
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-black/20 p-5">
      <div className="flex items-center gap-3 text-primary">
        <span className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-primary/20 bg-primary/[0.055]">
          {icon}
        </span>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      </div>
      <p className={`mt-4 text-3xl font-extrabold tracking-tight ${tone === "warning" ? "text-amber-300" : "text-emerald-300"}`}>
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-sub">{description}</p>
    </div>
  );
}
