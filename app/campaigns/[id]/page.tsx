"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import CampaignForm from "@/components/forms/campaign/CampaignForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getCampaignById = useAdminPortalStore((s) => s.getCampaignById);
  const updateCampaign = useAdminPortalStore((s) => s.updateCampaign);
  const deleteCampaign = useAdminPortalStore((s) => s.deleteCampaign);
  const projects = useAdminPortalStore((s) => s.projects);
  const raids = useAdminPortalStore((s) => s.raids);
  const quests = useAdminPortalStore((s) => s.quests);

  const campaign = useMemo(
    () => getCampaignById(params.id),
    [getCampaignById, params.id]
  );

  if (!campaign) {
    return (
      <AdminShell>
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Campaign not found</h1>
          <p className="mt-2 text-sm text-sub">
            This campaign could not be found in the admin portal store.
          </p>
        </div>
      </AdminShell>
    );
  }

  const project = projects.find((p) => p.id === campaign.projectId);
  const relatedRaids = raids.filter((r) => r.campaignId === campaign.id);
  const relatedQuests = quests.filter((q) => q.campaignId === campaign.id);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Campaign Detail
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-text">
              {campaign.title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{project?.name || "Unknown Project"}</Badge>
              <Badge className="capitalize">{campaign.campaignType}</Badge>
              <Badge className="capitalize">{campaign.visibility}</Badge>
              <Badge className="capitalize">{campaign.status}</Badge>
              {campaign.featured ? <Badge>Featured</Badge> : null}
            </div>

            <p className="mt-4 text-sm text-sub">{campaign.shortDescription}</p>

            {campaign.longDescription ? (
              <p className="mt-3 text-sm leading-6 text-sub">
                {campaign.longDescription}
              </p>
            ) : null}
          </div>

          <button
            onClick={async () => {
              await deleteCampaign(campaign.id);
              router.push("/campaigns");
            }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300"
          >
            Delete Campaign
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Project" value={project?.name || "-"} />
          <InfoCard label="XP Budget" value={campaign.xpBudget} />
          <InfoCard label="Participants" value={campaign.participants} />
          <InfoCard label="Progress" value={`${campaign.completionRate}%`} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Edit Campaign</h2>
            <p className="mt-2 text-sm text-sub">
              Update this campaign’s content, visibility and timing.
            </p>

            <div className="mt-6">
              <CampaignForm
                projects={projects}
                initialValues={{
                  projectId: campaign.projectId,

                  title: campaign.title,
                  slug: campaign.slug,

                  shortDescription: campaign.shortDescription,
                  longDescription: campaign.longDescription || "",

                  bannerUrl: campaign.bannerUrl || "",
                  thumbnailUrl: campaign.thumbnailUrl || "",

                  campaignType: campaign.campaignType,

                  xpBudget: campaign.xpBudget,
                  participants: campaign.participants,
                  completionRate: campaign.completionRate,

                  visibility: campaign.visibility,
                  featured: campaign.featured,

                  startsAt: campaign.startsAt || "",
                  endsAt: campaign.endsAt || "",

                  status: campaign.status,
                }}
                submitLabel="Update Campaign"
                onSubmit={async (values) => {
                  await updateCampaign(campaign.id, values);
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Campaign Assets</h2>

              <div className="mt-4 space-y-4">
                <DetailRow label="Slug" value={campaign.slug || "-"} />
                <DetailRow label="Type" value={campaign.campaignType} />
                <DetailRow label="Visibility" value={campaign.visibility} />
                <DetailRow label="Featured" value={campaign.featured ? "Yes" : "No"} />
                <DetailRow label="Starts At" value={campaign.startsAt || "-"} />
                <DetailRow label="Ends At" value={campaign.endsAt || "-"} />
              </div>
            </div>

            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Linked Content</h2>

              <div className="mt-4 grid gap-3">
                <DetailRow label="Raids" value={relatedRaids.length} />
                <DetailRow label="Quests" value={relatedQuests.length} />
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