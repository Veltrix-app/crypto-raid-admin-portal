"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import QuestForm from "@/components/forms/quest/QuestForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function QuestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getQuestById = useAdminPortalStore((s) => s.getQuestById);
  const updateQuest = useAdminPortalStore((s) => s.updateQuest);
  const deleteQuest = useAdminPortalStore((s) => s.deleteQuest);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);

  const quest = useMemo(
    () => getQuestById(params.id),
    [getQuestById, params.id]
  );

  if (!quest) {
    return (
      <AdminShell>
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Quest not found</h1>
          <p className="mt-2 text-sm text-sub">
            This quest could not be found in the admin portal store.
          </p>
        </div>
      </AdminShell>
    );
  }

  const project = projects.find((p) => p.id === quest.projectId);
  const campaign = campaigns.find((c) => c.id === quest.campaignId);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Quest Detail
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-text">
              {quest.title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{project?.name || "Unknown Project"}</Badge>
              <Badge>{campaign?.title || "Unknown Campaign"}</Badge>
              <Badge className="capitalize">{quest.questType}</Badge>
              <Badge className="capitalize">{quest.verificationType}</Badge>
              <Badge className="capitalize">{quest.status}</Badge>
            </div>

            <p className="mt-4 text-sm text-sub">{quest.description}</p>
            {quest.shortDescription ? (
              <p className="mt-3 text-sm leading-6 text-sub">
                {quest.shortDescription}
              </p>
            ) : null}
          </div>

          <button
            onClick={async () => {
              await deleteQuest(quest.id);
              router.push("/quests");
            }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300"
          >
            Delete Quest
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Project" value={project?.name || "-"} />
          <InfoCard label="Campaign" value={campaign?.title || "-"} />
          <InfoCard label="XP" value={quest.xp} />
          <InfoCard label="Auto Approve" value={quest.autoApprove ? "Yes" : "No"} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Edit Quest</h2>
            <p className="mt-2 text-sm text-sub">
              Update quest logic, verification and timing.
            </p>

            <div className="mt-6">
              <QuestForm
                projects={projects}
                campaigns={campaigns}
                initialValues={{
                  projectId: quest.projectId,
                  campaignId: quest.campaignId,

                  title: quest.title,
                  description: quest.description,
                  shortDescription: quest.shortDescription || "",

                  type: quest.type,
                  questType: quest.questType,
                  platform: quest.platform || "custom",

                  xp: quest.xp,
                  actionLabel: quest.actionLabel,
                  actionUrl: quest.actionUrl || "",

                  proofRequired: quest.proofRequired,
                  proofType: quest.proofType,

                  autoApprove: quest.autoApprove,
                  verificationType: quest.verificationType,
                  verificationConfig: quest.verificationConfig || "",

                  isRepeatable: quest.isRepeatable,
                  cooldownSeconds: quest.cooldownSeconds,
                  maxCompletionsPerUser: quest.maxCompletionsPerUser,
                  sortOrder: quest.sortOrder,

                  startsAt: quest.startsAt || "",
                  endsAt: quest.endsAt || "",

                  status: quest.status,
                }}
                submitLabel="Update Quest"
                onSubmit={async (values) => {
                  await updateQuest(quest.id, values);
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Quest Settings</h2>

              <div className="mt-4 space-y-4">
                <DetailRow label="Quest Type" value={quest.questType} />
                <DetailRow label="Platform" value={quest.platform || "-"} />
                <DetailRow label="Verification" value={quest.verificationType} />
                <DetailRow label="Proof Required" value={quest.proofRequired ? "Yes" : "No"} />
                <DetailRow label="Proof Type" value={quest.proofType} />
                <DetailRow label="Repeatable" value={quest.isRepeatable ? "Yes" : "No"} />
                <DetailRow label="Sort Order" value={quest.sortOrder} />
                <DetailRow label="Starts At" value={quest.startsAt || "-"} />
                <DetailRow label="Ends At" value={quest.endsAt || "-"} />
              </div>
            </div>

            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Action</h2>

              <div className="mt-4 space-y-4">
                <DetailRow label="Action Label" value={quest.actionLabel} />
                <DetailRow label="Action URL" value={quest.actionUrl || "-"} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold capitalize text-text">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card2 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full border border-line bg-card2 px-3 py-1 text-xs font-bold text-text ${className}`}
    >
      {children}
    </span>
  );
}