"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import RaidForm from "@/components/forms/raid/RaidForm";
import {
  DetailActionTile,
  DetailBadge,
  DetailHero,
  DetailMetaRow,
  DetailMetricCard,
  DetailSidebarSurface,
  DetailSurface,
} from "@/components/layout/detail/DetailPrimitives";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function RaidDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [raidView, setRaidView] = useState<"operate" | "configure">("operate");

  const getRaidById = useAdminPortalStore((s) => s.getRaidById);
  const updateRaid = useAdminPortalStore((s) => s.updateRaid);
  const deleteRaid = useAdminPortalStore((s) => s.deleteRaid);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);

  const raid = useMemo(() => getRaidById(params.id), [getRaidById, params.id]);

  if (!raid) {
    return (
      <AdminShell>
        <NotFoundState
          title="Raid not found"
          description="This raid could not be resolved from the current workspace state. It may have been deleted, moved to another project or not loaded into the active scope."
        />
      </AdminShell>
    );
  }

  const project = projects.find((p) => p.id === raid.projectId);
  const campaign = campaigns.find((c) => c.id === raid.campaignId);
  const readinessItems = [
    {
      label: "Target",
      value: raid.targetUrl ? "Connected" : "Missing destination",
      complete: !!raid.targetUrl,
    },
    {
      label: "Verification",
      value: raid.verificationType.replace(/_/g, " "),
      complete: true,
    },
    {
      label: "Instructions",
      value: raid.instructions.length ? `${raid.instructions.length} steps` : "No instructions",
      complete: raid.instructions.length > 0,
    },
    {
      label: "Timing",
      value: raid.timer || "No timer",
      complete: !!raid.timer,
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <DetailHero
          eyebrow="Raid Detail"
          title={raid.title}
          description={raid.shortDescription || raid.target}
          badges={
            <>
              <DetailBadge>{project?.name || "Unknown Project"}</DetailBadge>
              <DetailBadge>{campaign?.title || "Unknown Campaign"}</DetailBadge>
              <DetailBadge>{raid.platform}</DetailBadge>
              <DetailBadge>{raid.verificationType}</DetailBadge>
              <DetailBadge tone={raid.status === "active" ? "primary" : "default"}>
                {raid.status}
              </DetailBadge>
            </>
          }
          actions={
            <button
              onClick={async () => {
                await deleteRaid(raid.id);
                router.push("/raids");
              }}
              className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300 transition hover:bg-rose-500/15"
            >
              Delete Raid
            </button>
          }
          metrics={
            <>
              <DetailMetricCard label="Project" value={project?.name || "-"} hint="Workspace owning this raid." />
              <DetailMetricCard label="Campaign" value={campaign?.title || "-"} hint="Campaign this raid pushes." />
              <DetailMetricCard label="Reward XP" value={raid.rewardXp} hint="XP reward for raid participation." />
              <DetailMetricCard label="Participants" value={raid.participants} hint="Current visible pressure around this raid." />
            </>
          }
        />

        <div className="rounded-[28px] border border-line bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Raid workspace
              </p>
              <p className="mt-2 text-sm leading-6 text-sub">
                Operate mode keeps readiness and live pressure visible. Configure mode keeps the builder and raid settings focused.
              </p>
            </div>
            <SegmentToggle
              value={raidView}
              onChange={setRaidView}
              options={[
                { value: "operate", label: "Operate" },
                { value: "configure", label: "Configure" },
              ]}
            />
          </div>
        </div>

        {raidView === "operate" ? (
          <>
            <DetailSurface
              eyebrow="Raid Logic"
              title="Community pressure summary"
              description="This raid coordinates live pressure around a target post, account or destination. Keep the CTA crisp, the timer believable and the verification route easy to understand."
            >
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm leading-7 text-sub">{raid.target}</p>
              </div>
            </DetailSurface>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <DetailSurface
                eyebrow="Raid Readiness"
                title="What this raid still needs"
                description="A concise read on destination quality, instruction clarity and live timing before more contributors route in."
                aside={<DetailMetricCard label="Progress" value={`${raid.progress}%`} />}
              >
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {readinessItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4"
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
              </DetailSurface>

              <DetailSurface
                eyebrow="Next Actions"
                title="Keep raid pressure moving"
                description="Use these routes to validate the target, align campaign context and tighten instructions before traffic spikes."
              >
                <div className="mt-5 space-y-3">
                  <DetailActionTile
                    href={raid.targetUrl || "#edit-raid"}
                    label={raid.targetUrl ? "Open raid destination" : "Add raid destination"}
                    description={
                      raid.targetUrl
                        ? "Sanity-check the exact page contributors are expected to engage with."
                        : "Point this raid at the live post, profile or page before launch."
                    }
                  />
                  <DetailActionTile
                    href={campaign ? `/campaigns/${campaign.id}` : "/campaigns"}
                    label={campaign ? "Open campaign context" : "Connect a campaign"}
                    description={
                      campaign
                        ? "Keep the surrounding campaign narrative aligned with this raid."
                        : "Assign this raid to a campaign so it lives inside a broader pressure plan."
                    }
                  />
                  <DetailActionTile
                    href="#edit-raid"
                    label="Tune timing and instructions"
                    description="Use the builder below to tighten timer, verification and instruction quality."
                  />
                </div>
              </DetailSurface>
            </div>
          </>
        ) : null}

        {raidView === "configure" ? (
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <DetailSurface
              title="Edit Raid"
              description="Update raid target, instructions, verification and timing without leaving the detail workspace."
            >
              <div className="mt-6" id="edit-raid">
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

                    instructions: raid.instructions.length ? raid.instructions : [""],

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
            </DetailSurface>

            <div className="space-y-6">
              <DetailSidebarSurface title="Raid Settings">
                <div className="mt-4 space-y-4">
                  <DetailMetaRow label="Community" value={raid.community || "-"} />
                  <DetailMetaRow label="Platform" value={raid.platform} />
                  <DetailMetaRow label="Verification" value={raid.verificationType} />
                  <DetailMetaRow label="Timer" value={raid.timer || "-"} />
                  <DetailMetaRow label="Progress" value={`${raid.progress}%`} />
                  <DetailMetaRow label="Starts At" value={raid.startsAt || "-"} />
                  <DetailMetaRow label="Ends At" value={raid.endsAt || "-"} />
                </div>
              </DetailSidebarSurface>

              <DetailSidebarSurface title="Instructions">
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
              </DetailSidebarSurface>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
