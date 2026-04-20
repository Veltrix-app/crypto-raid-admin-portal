"use client";

import { QuestVerificationPreview } from "@/lib/quest-verification";
import { AdminQuest } from "@/types/entities/quest";

export default function QuestVerificationRail({
  preview,
  verificationProvider,
  proofRequired,
  proofType,
}: {
  preview: QuestVerificationPreview;
  verificationProvider?: AdminQuest["verificationProvider"];
  proofRequired: boolean;
  proofType: AdminQuest["proofType"];
}) {
  return (
    <div className="space-y-4 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Verification rail
          </p>
          <p className="mt-3 text-lg font-extrabold tracking-[-0.02em] text-text">
            {preview.routeLabel}
          </p>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-text">
          {(verificationProvider || "custom").replace(/_/g, " ")}
        </span>
      </div>

      <p className="text-sm leading-6 text-sub">{preview.routeDescription}</p>

      <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
        <div className="grid gap-3 md:grid-cols-2">
          <InfoRow
            label="Proof path"
            value={proofRequired ? proofType.replace(/_/g, " ") : "No proof required"}
          />
          <InfoRow label="Expectation" value={preview.proofExpectation} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoRow
          label="Required config"
          value={
            preview.requiredConfigKeys.length > 0
              ? preview.requiredConfigKeys.join(", ")
              : "No required keys"
          }
        />
        <InfoRow
          label="Missing keys"
          value={
            preview.invalidConfig
              ? "Invalid JSON"
              : preview.missingConfigKeys.length > 0
                ? preview.missingConfigKeys.join(", ")
                : "None"
          }
        />
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm leading-6 text-text">{value}</p>
    </div>
  );
}
