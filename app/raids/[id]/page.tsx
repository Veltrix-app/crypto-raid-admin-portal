"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import RaidForm from "@/components/forms/raid/RaidForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function RaidDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getRaidById = useAdminPortalStore((s) => s.getRaidById);
  const updateRaid = useAdminPortalStore((s) => s.updateRaid);
  const deleteRaid = useAdminPortalStore((s) => s.deleteRaid);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);

  const raid = useMemo(
    () => getRaidById(params.id),
    [getRaidById, params.id]
  );

  if (!raid) {
    return (
      <AdminShell>
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Raid not found</h1>
          <p className="mt-2 text-sm text-sub">
            This raid could not be found in the admin portal store.
          </p>
        </div>
      </AdminShell>
    );
  }

  const project = projects.find((p) => p.id === raid.projectId);
  const campaign = campaigns.find((c) => c.id === raid.campaignId);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Raid Detail
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-text">
              {raid.title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{project?.name || "Unknown Project"}</Badge>
              <Badge>{campaign?.title || "Unknown Campaign"}</Badge>
              <Badge className="capitalize">{raid.platform}</Badge>
              <Badge className="capitalize">{raid.verificationType}</Badge>
              <Badge className="capitalize">{raid.status}</Badge>
            </div>

            <p className="mt-4 text-sm text-sub">{raid.shortDescription}</p>
            <p className="mt-3 text-sm leading-6 text-sub">{raid.target}</p>
          </div>

          <button
            onClick={async () => {
              await deleteRaid(raid.id);
              router.push("/raids");
            }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300"
          >
            Delete Raid
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Project" value={project?.name || "-"} />
          <InfoCard label="Campaign" value={campaign?.title || "-"} />
          <InfoCard label="Reward XP" value={raid.rewardXp} />
          <InfoCard label="Participants" value={raid.participants} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Edit Raid</h2>
            <p className="mt-2 text-sm text-sub">
              Update raid target, instructions, verification and timing.
            </p>

            <div className="mt-6">
              <RaidForm
                projects={projects}
                campaigns={campaigns}
                initialValues={{
                  projectId: raid.projectId,
                  campaignId: raid.campaignId,

                  title: raid.title,
                  shortDescription: raid.shortDescription || "",
                  community: raid.community,
                  target: raid.target,

                  banner: raid.banner || "",

                  rewardXp: raid.rewardXp,
                  participants: raid.participants,
                  progress: raid.progress,
                  timer: raid.timer || "",

                  platform: raid.platform,

                  targetUrl: raid.targetUrl || "",
                  targetPostId: raid.targetPostId || "",
                  targetAccountHandle: raid.targetAccountHandle || "",

                  verificationType: raid.verificationType,
                  verificationConfig: raid.verificationConfig || "",

                  instructions: raid.instructions.length
                    ? raid.instructions
                    : [""],

                  startsAt: raid.startsAt || "",
                  endsAt: raid.endsAt || "",

                  status: raid.status,
                }}
                submitLabel="Update Raid"
                onSubmit={async (values) => {
                  await updateRaid(raid.id, values);
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Raid Settings</h2>

              <div className="mt-4 space-y-4">
                <DetailRow label="Community" value={raid.community || "-"} />
                <DetailRow label="Platform" value={raid.platform} />
                <DetailRow label="Verification" value={raid.verificationType} />
                <DetailRow label="Timer" value={raid.timer || "-"} />
                <DetailRow label="Progress" value={`${raid.progress}%`} />
                <DetailRow label="Starts At" value={raid.startsAt || "-"} />
                <DetailRow label="Ends At" value={raid.endsAt || "-"} />
              </div>
            </div>

            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Instructions</h2>

              <div className="mt-4 space-y-3">
                {raid.instructions.length > 0 ? (
                  raid.instructions.map((step, index) => (
                    <div
                      key={`${raid.id}-${index}`}
                      className="rounded-2xl border border-line bg-card2 px-4 py-3"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                        Step {index + 1}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-text">{step}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-sub">No instructions configured.</p>
                )}
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