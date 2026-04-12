"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectForm from "@/components/forms/project/ProjectForm";
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

  if (!project) {
    return (
      <AdminShell>
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Project not found</h1>
          <p className="mt-2 text-sm text-sub">
            This project could not be found in the admin portal store.
          </p>
        </div>
      </AdminShell>
    );
  }

  const relatedCampaigns = campaigns.filter((c) => c.projectId === project.id);
  const relatedQuests = quests.filter((quest) => quest.projectId === project.id);
  const relatedRewards = rewards.filter((reward) => reward.projectId === project.id);
  const relatedTeamMembers = teamMembers.filter((member) => member.projectId === project.id);
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
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Project Detail
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-text">
              {project.logo} {project.name}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{project.chain}</Badge>
              {project.category ? <Badge>{project.category}</Badge> : null}
              <Badge className="capitalize">{project.status}</Badge>
              <Badge className="capitalize">{project.onboardingStatus}</Badge>
              {project.isFeatured ? <Badge>Featured</Badge> : null}
              {project.isPublic ? <Badge>Public</Badge> : <Badge>Private</Badge>}
            </div>

            <p className="mt-4 text-sm text-sub">{project.description}</p>

            {project.longDescription ? (
              <p className="mt-3 text-sm leading-6 text-sub">
                {project.longDescription}
              </p>
            ) : null}
          </div>

          <button
            onClick={async () => {
              await deleteProject(project.id);
              router.push("/projects");
            }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300"
          >
            Delete Project
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Chain" value={project.chain} />
          <InfoCard label="Members" value={project.members.toLocaleString()} />
          <InfoCard label="Campaigns" value={relatedCampaigns.length} />
          <InfoCard label="Onboarding" value={project.onboardingStatus} />
        </div>

        {showLaunchpad ? (
          <div className="rounded-[28px] border border-line bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Workspace Launchpad
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-text">
                  Give {project.name} a strong first setup
                </h2>
                <p className="mt-3 text-sm text-sub">
                  This checklist keeps a newly approved project moving from onboarding into a campaign-ready workspace.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-card2 px-4 py-3 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  Progress
                </p>
                <p className="mt-2 text-3xl font-extrabold text-text">
                  {completedLaunchpadSteps}/4
                </p>
              </div>
            </div>

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
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div id="edit-project" className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Edit Project</h2>
            <p className="mt-2 text-sm text-sub">
              Update how this project appears in the app and portal.
            </p>

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
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Project Assets</h2>

              <div className="mt-4 space-y-4">
                <DetailRow label="Slug" value={project.slug || "-"} />
                <DetailRow label="Website" value={project.website || "-"} />
                <DetailRow label="X URL" value={project.xUrl || "-"} />
                <DetailRow label="Telegram URL" value={project.telegramUrl || "-"} />
                <DetailRow label="Discord URL" value={project.discordUrl || "-"} />
                <DetailRow label="Contact Email" value={project.contactEmail || "-"} />
                <DetailRow
                  label="Featured"
                  value={project.isFeatured ? "Yes" : "No"}
                />
                <DetailRow
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
            </div>

            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Related Campaigns</h2>

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
