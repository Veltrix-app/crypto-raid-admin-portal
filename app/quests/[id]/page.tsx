"use client";

import Link from "next/link";
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
  const rewards = useAdminPortalStore((s) => s.rewards);
  const submissions = useAdminPortalStore((s) => s.submissions);

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
  const relatedRewards = rewards.filter((reward) => reward.projectId === quest.projectId);
  const relatedSubmissions = submissions.filter((submission) => submission.questId === quest.id);
  const pendingSubmissions = relatedSubmissions.filter(
    (submission) => submission.status === "pending"
  );
  const questBlueprintSummary = getQuestBlueprintSummary(quest.questType);
  const questReadinessItems = [
    {
      label: "Destination",
      value: quest.actionUrl ? "Connected" : "Missing URL",
      complete: !!quest.actionUrl,
    },
    {
      label: "Verification",
      value: quest.verificationType.replace(/_/g, " "),
      complete: true,
    },
    {
      label: "Proof Flow",
      value: quest.proofRequired ? quest.proofType : "No proof required",
      complete: !quest.proofRequired || quest.proofType !== "none",
    },
    {
      label: "Moderation",
      value: pendingSubmissions.length
        ? `${pendingSubmissions.length} pending`
        : "Clear",
      complete: pendingSubmissions.length === 0,
    },
  ];

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

            <div className="mt-5 rounded-2xl border border-line bg-card2 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Builder Summary
              </p>
              <p className="mt-2 text-sm leading-6 text-sub">
                {questBlueprintSummary}
              </p>
            </div>
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

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Quest Readiness
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-text">
                  What this quest still needs
                </h2>
              </div>

              <div className="rounded-2xl border border-line bg-card2 px-4 py-3 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  Pending Reviews
                </p>
                <p className="mt-2 text-2xl font-extrabold text-text">
                  {pendingSubmissions.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {questReadinessItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-line bg-card2 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-text">{item.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                        item.complete
                          ? "bg-primary/15 text-primary"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {item.complete ? "Ready" : "Needs attention"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-sub capitalize">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Next Actions
            </p>
            <h2 className="mt-2 text-xl font-extrabold text-text">
              Keep this campaign moving
            </h2>

            <div className="mt-5 space-y-3">
              <ActionLink
                href={quest.actionUrl || "#edit-quest"}
                label={quest.actionUrl ? "Open quest destination" : "Add quest destination"}
                description={
                  quest.actionUrl
                    ? "Sanity-check the contributor journey from the exact destination page."
                    : "Point this quest at the live page, post or wallet action before launch."
                }
              />
              <ActionLink
                href="/submissions"
                label="Review submissions"
                description={`${relatedSubmissions.length} submission${relatedSubmissions.length === 1 ? "" : "s"} linked to this quest.`}
              />
              <ActionLink
                href={relatedRewards.length > 0 ? "/rewards" : "/rewards/new"}
                label={relatedRewards.length > 0 ? "Link campaign rewards" : "Create a reward"}
                description={
                  relatedRewards.length > 0
                    ? `${relatedRewards.length} reward${relatedRewards.length === 1 ? "" : "s"} already exist in this project.`
                    : "Add a reward next so contributors see a clear payoff for completing quests."
                }
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div id="edit-quest" className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Edit Quest</h2>
            <p className="mt-2 text-sm text-sub">
              Update quest logic, verification and timing.
            </p>

            <div className="mt-6">
              <QuestForm
                projects={projects}
                campaigns={campaigns}
                defaultProjectId={quest.projectId}
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
                <DetailRow label="Submissions" value={relatedSubmissions.length} />
                <DetailRow label="Pending Reviews" value={pendingSubmissions.length} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function getQuestBlueprintSummary(questType: string) {
  const questTypeLabel = questType.replace(/_/g, " ");

  switch (questType) {
    case "social_follow":
      return "This quest is set up as a social growth touchpoint. The critical thing here is making the target account and CTA unmistakably clear so contributors can complete it in one tap.";
    case "telegram_join":
    case "discord_join":
      return "This quest is positioned as a community entry point. Make sure the invite destination is stable and the moderation team is ready for new members once traffic starts flowing.";
    case "wallet_connect":
    case "token_hold":
    case "nft_hold":
    case "onchain_tx":
      return "This quest acts as a wallet or onchain verification step. The most important part is that the verification config matches the exact asset, contract or action you want to validate.";
    case "referral":
      return "This quest is a growth loop. Treat the reward and verification rules carefully so projects attract genuine referrals instead of low-quality farming.";
    case "manual_proof":
      return "This quest depends on human review, so the proof instructions need to be extremely explicit. Clear proof rules reduce moderation load and improve submission quality.";
    default:
      return `This quest is currently configured as ${questTypeLabel}. Use the builder to tighten the action destination, verification and reward loop before making it a core campaign step.`;
  }
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold capitalize text-text">{value}</p>
    </div>
  );
}

function ActionLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-line bg-card2 p-4 transition hover:border-primary/40"
    >
      <p className="font-bold text-text">{label}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{description}</p>
    </Link>
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
