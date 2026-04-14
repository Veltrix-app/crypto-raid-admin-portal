"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectForm from "@/components/forms/project/ProjectForm";
import {
  DetailBadge,
  DetailHero,
  DetailMetaRow,
  DetailMetricCard,
  DetailSidebarSurface,
  DetailSurface,
} from "@/components/layout/detail/DetailPrimitives";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const memberships = useAdminAuthStore((s) => s.memberships);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
  const getProjectById = useAdminPortalStore((s) => s.getProjectById);
  const updateProject = useAdminPortalStore((s) => s.updateProject);
  const deleteProject = useAdminPortalStore((s) => s.deleteProject);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const quests = useAdminPortalStore((s) => s.quests);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);
  const [discordIntegrationStatus, setDiscordIntegrationStatus] = useState<string>("unknown");
  const [telegramIntegrationStatus, setTelegramIntegrationStatus] = useState<string>("unknown");
  const [xIntegrationStatus, setXIntegrationStatus] = useState<string>("unknown");

  const project = useMemo(
    () => getProjectById(params.id),
    [getProjectById, params.id]
  );

  useEffect(() => {
    if (!project) return;
    const hasMembership = memberships.some((item) => item.projectId === project.id);
    if (hasMembership && activeProjectId !== project.id) {
      setActiveProjectId(project.id);
    }
  }, [activeProjectId, memberships, project, setActiveProjectId]);

  useEffect(() => {
    let cancelled = false;

    async function loadProjectIntegrations() {
      if (!project?.id) return;

      const supabase = createClient();
      const [{ data: discordData }, { data: telegramData }, { data: xData }] = await Promise.all([
        supabase
          .from("project_integrations")
          .select("status")
          .eq("project_id", project.id)
          .eq("provider", "discord")
          .maybeSingle(),
        supabase
          .from("project_integrations")
          .select("status")
          .eq("project_id", project.id)
          .eq("provider", "telegram")
          .maybeSingle(),
        supabase
          .from("project_integrations")
          .select("status")
          .eq("project_id", project.id)
          .eq("provider", "x")
          .maybeSingle(),
      ]);

      if (cancelled) return;
      setDiscordIntegrationStatus(discordData?.status ?? "not_connected");
      setTelegramIntegrationStatus(telegramData?.status ?? "not_connected");
      setXIntegrationStatus(xData?.status ?? "not_connected");
    }

    loadProjectIntegrations();

    return () => {
      cancelled = true;
    };
  }, [project?.id]);

  if (!project) {
    return (
      <AdminShell>
        <NotFoundState
          title="Project not found"
          description="This project could not be resolved from the current admin portal store state. It may have been removed, be outside your workspace scope, or not have loaded yet."
        />
      </AdminShell>
    );
  }

  const relatedCampaigns = campaigns.filter((c) => c.projectId === project.id);
  const relatedQuests = quests.filter((quest) => quest.projectId === project.id);
  const relatedRewards = rewards.filter((reward) => reward.projectId === project.id);
  const relatedTeamMembers = teamMembers.filter((member) => member.projectId === project.id);
  const connectedLinks = [
    project.website,
    project.xUrl,
    project.telegramUrl,
    project.discordUrl,
    project.docsUrl,
    project.waitlistUrl,
  ].filter(Boolean).length;
  const templateContextCount = [
    project.docsUrl,
    project.waitlistUrl,
    project.launchPostUrl,
    project.tokenContractAddress,
    project.nftContractAddress,
    project.primaryWallet,
    project.brandAccent,
    project.brandMood,
  ].filter(Boolean).length;
  const publicProfileReadiness = [
    {
      label: "Brand identity",
      value: project.logo && project.name ? "Logo and name are set" : "Missing logo or project name",
      complete: Boolean(project.logo && project.name),
    },
    {
      label: "Public copy",
      value: project.description ? "Short profile is ready" : "Add a short public description",
      complete: Boolean(project.description),
    },
    {
      label: "Long narrative",
      value: project.longDescription ? "Long-form profile added" : "Add a richer public narrative",
      complete: Boolean(project.longDescription),
    },
    {
      label: "Social surface",
      value: connectedLinks > 0 ? `${connectedLinks} channels connected` : "No channels connected yet",
      complete: connectedLinks > 0,
    },
    {
      label: "Template context",
      value:
        templateContextCount > 0
          ? `${templateContextCount} advanced project inputs are ready`
          : "Add docs, waitlist, launch or contract context",
      complete: templateContextCount > 0,
    },
    {
      label: "Visibility state",
      value: project.isPublic ? "Workspace can be surfaced publicly" : "Workspace is private",
      complete: true,
    },
  ];
  const completedPublicReadiness = publicProfileReadiness.filter((item) => item.complete).length;
  const launchpadSteps = [
    {
      title: "Review workspace settings",
      description: project.website || project.contactEmail
        ? "Brand, links and contact details are already attached to this project."
        : "Complete the project profile so campaigns and public pages look credible from day one.",
      href: "#edit-project",
      cta: project.website || project.contactEmail ? "Refine profile" : "Complete profile",
      status: project.website || project.contactEmail ? "ready" : "next",
    },
    {
      title: "Create your first campaign",
      description: relatedCampaigns.length > 0
        ? `${relatedCampaigns.length} campaign workspace${relatedCampaigns.length > 1 ? "s are" : " is"} already available.`
        : "Spin up the first campaign so this workspace can start collecting quests, raids and participants.",
      href: "/campaigns/new",
      cta: relatedCampaigns.length > 0 ? "Open campaign builder" : "Create campaign",
      status: relatedCampaigns.length > 0 ? "ready" : "next",
    },
    {
      title: "Add engagement mechanics",
      description: relatedQuests.length > 0 || relatedRewards.length > 0
        ? `${relatedQuests.length} quest${relatedQuests.length === 1 ? "" : "s"} and ${relatedRewards.length} reward${relatedRewards.length === 1 ? "" : "s"} are configured.`
        : "Define quests and rewards next so contributors know what to do and what they earn.",
      href: relatedQuests.length > 0 ? "/quests" : "/quests/new",
      cta: relatedQuests.length > 0 ? "Review quests" : "Create first quest",
      status: relatedQuests.length > 0 || relatedRewards.length > 0 ? "ready" : "next",
    },
    {
      title: "Invite your team",
      description: relatedTeamMembers.length > 1
        ? `${relatedTeamMembers.length} teammates are already attached to this workspace.`
        : "Add reviewers and collaborators so moderation and campaign operations don't bottleneck on one person.",
      href: "/settings/team",
      cta: relatedTeamMembers.length > 1 ? "Manage team" : "Invite team",
      status: relatedTeamMembers.length > 1 ? "ready" : "next",
    },
  ] as const;
  const completedLaunchpadSteps = launchpadSteps.filter((step) => step.status === "ready").length;
  const showLaunchpad =
    project.onboardingStatus !== "approved" ||
    relatedCampaigns.length === 0 ||
    relatedQuests.length === 0 ||
    relatedTeamMembers.length <= 1;

  return (
    <AdminShell>
      <div className="space-y-6">
        <DetailHero
          eyebrow="Project Detail"
          title={`${project.logo} ${project.name}`}
          description={project.longDescription || project.description}
          badges={
            <>
              <DetailBadge>{project.chain}</DetailBadge>
              {project.category ? <DetailBadge>{project.category}</DetailBadge> : null}
              <DetailBadge tone={project.status === "active" ? "primary" : "default"}>
                {project.status}
              </DetailBadge>
              <DetailBadge tone={project.onboardingStatus === "approved" ? "primary" : "warning"}>
                {project.onboardingStatus}
              </DetailBadge>
              {project.isFeatured ? <DetailBadge tone="warning">Featured</DetailBadge> : null}
              <DetailBadge>{project.isPublic ? "Public" : "Private"}</DetailBadge>
            </>
          }
          actions={
            <button
              onClick={async () => {
                await deleteProject(project.id);
                router.push("/projects");
              }}
              className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300 transition hover:bg-rose-500/15"
            >
              Delete Project
            </button>
          }
          metrics={
            <>
              <DetailMetricCard label="Chain" value={project.chain} hint="Primary ecosystem for this workspace." />
              <DetailMetricCard label="Members" value={project.members.toLocaleString()} hint="Community size currently visible on the public surface." />
              <DetailMetricCard label="Campaigns" value={relatedCampaigns.length} hint="Active campaign spaces inside this workspace." />
              <DetailMetricCard label="Onboarding" value={project.onboardingStatus} hint="Current approval posture for this workspace." />
              <DetailMetricCard label="Template Context" value={templateContextCount} hint="Advanced autofill fields currently attached." />
            </>
          }
        />

        {showLaunchpad ? (
          <DetailSurface
            eyebrow="Workspace Launchpad"
            title={`Give ${project.name} a strong first setup`}
            description="This checklist keeps a newly approved project moving from onboarding into a campaign-ready workspace."
            aside={<DetailMetricCard label="Progress" value={`${completedLaunchpadSteps}/4`} />}
          >
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {launchpadSteps.map((step) => (
                <Link
                  key={step.title}
                  href={step.href}
                  className="rounded-2xl border border-line bg-card2 p-5 transition hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                            step.status === "ready"
                              ? "bg-primary/15 text-primary"
                              : "bg-white/5 text-text"
                          }`}
                        >
                          {step.status === "ready" ? "Ready" : "Next"}
                        </span>
                        <p className="font-bold text-text">{step.title}</p>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-sub">{step.description}</p>
                    </div>

                    <span className="text-sm font-semibold text-primary">{step.cta}</span>
                  </div>
                </Link>
              ))}
            </div>
          </DetailSurface>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <DetailSurface
            title="Edit Project"
            description="Update how this project appears in the app and portal without leaving the workspace detail view."
          >
            <div className="mt-6">
              <ProjectForm
                initialValues={{
                  name: project.name,
                  slug: project.slug,

                  chain: project.chain,
                  category: project.category || "",

                  status: project.status,
                  onboardingStatus: project.onboardingStatus,

                  description: project.description,
                  longDescription: project.longDescription || "",

                  members: project.members,
                  campaigns: project.campaigns,

                  logo: project.logo,
                  bannerUrl: project.bannerUrl || "",

                  website: project.website || "",
                  xUrl: project.xUrl || "",
                  telegramUrl: project.telegramUrl || "",
                  discordUrl: project.discordUrl || "",
                  docsUrl: project.docsUrl || "",
                  waitlistUrl: project.waitlistUrl || "",
                  launchPostUrl: project.launchPostUrl || "",
                  tokenContractAddress: project.tokenContractAddress || "",
                  nftContractAddress: project.nftContractAddress || "",
                  primaryWallet: project.primaryWallet || "",
                  brandAccent: project.brandAccent || "",
                  brandMood: project.brandMood || "",

                  contactEmail: project.contactEmail || "",

                  isFeatured: project.isFeatured ?? false,
                  isPublic: project.isPublic ?? true,
                }}
                submitLabel="Update Project"
                onSubmit={async (values) => {
                  await updateProject(project.id, values);
                }}
              />
            </div>
          </DetailSurface>

          <div className="space-y-6">
            <DetailSurface
              eyebrow="Public Profile"
              title="Brand and community-facing preview"
              description="This is how the workspace reads when someone lands on it from discovery or a campaign entry point."
              aside={<DetailMetricCard label="Readiness" value={`${completedPublicReadiness}/${publicProfileReadiness.length}`} />}
            >
              <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-card2">
                <div className="h-36 bg-gradient-to-br from-primary/20 via-card to-card2">
                  {project.bannerUrl ? (
                    <img
                      src={project.bannerUrl}
                      alt={`${project.name} banner`}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-card text-3xl">
                      {project.logo || "🚀"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-xl font-extrabold text-text">{project.name}</p>
                        <DetailBadge>{project.chain}</DetailBadge>
                        {project.category ? <DetailBadge>{project.category}</DetailBadge> : null}
                        <DetailBadge>{project.isPublic ? "Public" : "Private"}</DetailBadge>
                      </div>

                      <p className="mt-2 text-sm text-sub">/{project.slug || "project-slug"}</p>
                      <p className="mt-4 text-sm leading-6 text-sub">
                        {project.description || "Add a short public description so this project feels credible from the first visit."}
                      </p>
                    </div>
                  </div>

                  {project.longDescription ? (
                    <div className="mt-5 rounded-2xl border border-line bg-card px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                        Long Form Narrative
                      </p>
                      <p className="mt-3 text-sm leading-6 text-sub">{project.longDescription}</p>
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <DetailMetaRow label="Website" value={project.website || "Not connected"} />
                    <DetailMetaRow label="X URL" value={project.xUrl || "Not connected"} />
                    <DetailMetaRow label="Telegram URL" value={project.telegramUrl || "Not connected"} />
                    <DetailMetaRow label="Discord URL" value={project.discordUrl || "Not connected"} />
                    <DetailMetaRow label="Docs URL" value={project.docsUrl || "Not connected"} />
                    <DetailMetaRow label="Waitlist URL" value={project.waitlistUrl || "Not connected"} />
                    <DetailMetaRow label="Launch Post URL" value={project.launchPostUrl || "Not connected"} />
                    <DetailMetaRow label="Primary Wallet" value={project.primaryWallet || "Not set"} />
                  </div>
                </div>
              </div>
            </DetailSurface>

            <DetailSidebarSurface title="Project Assets">
              <div className="mt-4 space-y-4">
                <DetailMetaRow label="Slug" value={project.slug || "-"} />
                <DetailMetaRow label="Website" value={project.website || "-"} />
                <DetailMetaRow label="X URL" value={project.xUrl || "-"} />
                <DetailMetaRow label="Telegram URL" value={project.telegramUrl || "-"} />
                <DetailMetaRow label="Discord URL" value={project.discordUrl || "-"} />
                <DetailMetaRow label="Docs URL" value={project.docsUrl || "-"} />
                <DetailMetaRow label="Waitlist URL" value={project.waitlistUrl || "-"} />
                <DetailMetaRow label="Launch Post URL" value={project.launchPostUrl || "-"} />
                <DetailMetaRow label="Contact Email" value={project.contactEmail || "-"} />
                <DetailMetaRow
                  label="Featured"
                  value={project.isFeatured ? "Yes" : "No"}
                />
                <DetailMetaRow
                  label="Public"
                  value={project.isPublic ? "Yes" : "No"}
                />
              </div>

              {project.bannerUrl ? (
                <div className="mt-6">
                  <p className="mb-2 text-sm font-semibold text-text">Banner Preview</p>
                  <div className="overflow-hidden rounded-2xl border border-line bg-card2">
                    <img
                      src={project.bannerUrl}
                      alt={`${project.name} banner`}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                </div>
              ) : null}
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Template Context">
              <div className="mt-4 space-y-4">
                <DetailMetaRow
                  label="Token Contract"
                  value={project.tokenContractAddress || "-"}
                />
                <DetailMetaRow
                  label="NFT Contract"
                  value={project.nftContractAddress || "-"}
                />
                <DetailMetaRow
                  label="Primary Wallet"
                  value={project.primaryWallet || "-"}
                />
                <DetailMetaRow
                  label="Brand Accent"
                  value={project.brandAccent || "-"}
                />
                <DetailMetaRow
                  label="Brand Mood"
                  value={project.brandMood || "-"}
                />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Integration Readiness">
              <div className="mt-4 space-y-4">
                <DetailMetaRow
                  label="X follow verification"
                  value={
                    xIntegrationStatus === "connected"
                      ? "X integration connected"
                      : xIntegrationStatus === "needs_attention"
                      ? "X integration needs attention"
                      : "X integration not connected"
                  }
                />
                <DetailMetaRow
                  label="Discord quest verification"
                  value={
                    discordIntegrationStatus === "connected"
                      ? "Discord integration connected"
                      : discordIntegrationStatus === "needs_attention"
                      ? "Discord integration needs attention"
                      : "Discord integration not connected"
                  }
                />
                <DetailMetaRow
                  label="Telegram quest verification"
                  value={
                    telegramIntegrationStatus === "connected"
                      ? "Telegram integration connected"
                      : telegramIntegrationStatus === "needs_attention"
                      ? "Telegram integration needs attention"
                      : "Telegram integration not connected"
                  }
                />
                <DetailMetaRow
                  label="X profile"
                  value={project.xUrl || "No X URL on project yet"}
                />
                <DetailMetaRow
                  label="Discord invite"
                  value={project.discordUrl || "No Discord URL on project yet"}
                />
                <DetailMetaRow
                  label="Telegram group"
                  value={project.telegramUrl || "No Telegram URL on project yet"}
                />
                <DetailMetaRow
                  label="What this unlocks"
                  value={[
                    xIntegrationStatus === "connected"
                      ? "X follow quests can route into integration verification."
                      : "Connect the X integration to move follow quests beyond placeholder automation.",
                    discordIntegrationStatus === "connected"
                      ? "Discord join quests can route into integration verification."
                      : "Connect the Discord integration to move Discord join quests beyond placeholder automation.",
                    telegramIntegrationStatus === "connected"
                      ? "Telegram join quests can route into integration verification."
                      : "Connect the Telegram integration to move Telegram join quests beyond placeholder automation.",
                  ].join(" ")}
                />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Public Profile Readiness">
              <div className="mt-4 space-y-3">
                {publicProfileReadiness.map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-text">{item.label}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                          item.complete ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {item.complete ? "Ready" : "Needs work"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-sub">{item.value}</p>
                  </div>
                ))}
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Related Campaigns">
              <div className="mt-4 grid gap-3">
                {relatedCampaigns.length > 0 ? (
                  relatedCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="rounded-2xl border border-line bg-card2 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-text">
                            {campaign.title}
                          </p>
                          <p className="mt-1 text-sm text-sub">
                            {campaign.status} • {campaign.participants} participants
                          </p>
                        </div>

                        <button
                          onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          className="rounded-xl border border-line px-3 py-2 font-semibold"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-line bg-card2 p-5">
                    <p className="text-sm font-semibold text-text">
                      No campaigns linked yet.
                    </p>
                    <p className="mt-2 text-sm text-sub">
                      Start with a campaign so this workspace has a home for quests, raids and rewards.
                    </p>
                    <button
                      onClick={() => router.push("/campaigns/new")}
                      className="mt-4 rounded-xl bg-primary px-4 py-2 font-bold text-black"
                    >
                      Create first campaign
                    </button>
                  </div>
                )}
              </div>
            </DetailSidebarSurface>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

