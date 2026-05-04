"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Gauge, Rocket, ShieldAlert } from "lucide-react";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { LoadingState, NotFoundState } from "@/components/layout/state/StatePrimitives";
import ProjectLaunchChecklist from "@/components/projects/launch/ProjectLaunchChecklist";
import ProjectLaunchRail from "@/components/projects/launch/ProjectLaunchRail";
import ProjectNextActions from "@/components/projects/launch/ProjectNextActions";
import ProjectTemplateLibrary from "@/components/projects/templates/ProjectTemplateLibrary";
import OpsIncidentPanel from "@/components/platform/OpsIncidentPanel";
import OpsOverridePanel from "@/components/platform/OpsOverridePanel";
import { createClient } from "@/lib/supabase/client";
import { useProjectOps } from "@/hooks/useProjectOps";
import { buildProjectBuilderLibrary } from "@/lib/templates/project-builder-library";
import { buildProjectWorkspaceHealthPills } from "@/lib/projects/workspace-selectors";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type LaunchWorkspaceView = "setup" | "launch";
type StepStatus = "complete" | "attention" | "blocked";
type ReadinessSeverity = "critical" | "warning";
type ReadinessStatus = "ready" | "watching" | "blocked";
type LaunchTier = "blocked" | "warming_up" | "launchable" | "live_ready";

type LaunchStep = {
  id: string;
  title: string;
  summary: string;
  metric: string;
  status: StepStatus;
  href: string;
  blockers: string[];
};

type ReadinessIssue = {
  id: string;
  title: string;
  summary: string;
  severity: ReadinessSeverity;
  href: string;
};

type ReadinessGroup = {
  id: string;
  title: string;
  status: ReadinessStatus;
  score: number;
  summary: string;
  signals: string[];
};

type LaunchSnapshot = {
  projectId: string;
  projectName: string;
  facts: {
    campaignCount: number;
    liveCampaignCount: number;
    questCount: number;
    liveQuestCount: number;
    raidCount: number;
    liveRaidCount: number;
    rewardCount: number;
    liveRewardCount: number;
    connectedProviderCount: number;
    configuredCommunityTargets: number;
    testedProviderCount: number;
    activeWalletCount: number;
    activeAssetCount: number;
  };
  onboarding: {
    totalSteps: number;
    completedSteps: number;
    completionRatio: number;
    steps: LaunchStep[];
    nextAction: {
      stepId: string;
      title: string;
      summary: string;
      href: string;
    } | null;
  };
  readiness: {
    score: number;
    tier: LaunchTier;
    hardBlockers: ReadinessIssue[];
    softBlockers: ReadinessIssue[];
    recommendedAction: {
      title: string;
      summary: string;
      href: string;
    } | null;
    groups: ReadinessGroup[];
    ops: {
      openIncidents: number;
      criticalIncidents: number;
      activeOverrides: number;
    };
  };
};

const VIEW_OPTIONS = [
  { value: "setup", label: "Setup" },
  { value: "launch", label: "Launch" },
] as const;

function ProjectLaunchContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const getProjectById = useAdminPortalStore((state) => state.getProjectById);
  const campaigns = useAdminPortalStore((state) => state.campaigns);
  const quests = useAdminPortalStore((state) => state.quests);
  const rewards = useAdminPortalStore((state) => state.rewards);
  const projectBuilderTemplates = useAdminPortalStore(
    (state) => state.projectBuilderTemplates
  );
  const project = useMemo(() => getProjectById(params.id), [getProjectById, params.id]);

  const [view, setView] = useState<LaunchWorkspaceView>("setup");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<LaunchSnapshot | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [handoffNotice, setHandoffNotice] = useState(false);
  const accountEntry = useAccountEntryGuard();

  const projectOps = useProjectOps(project?.id);
  const source = searchParams.get("source");
  const onboardingAccountId = accountEntry.accessState?.primaryAccount?.id ?? null;
  const onboardingCurrentStep = accountEntry.accessState?.primaryAccount?.currentStep ?? null;
  const completedSteps = accountEntry.accessState?.primaryAccount?.completedSteps ?? [];

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      if (!params.id) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/projects/${params.id}/launch-readiness`, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | ({ ok?: boolean } & LaunchSnapshot & { error?: string })
          | null;

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Failed to load launch workspace.");
        }

        if (cancelled) {
          return;
        }

        setSnapshot(payload);
        setActiveStepId((current) => {
          if (current && payload.onboarding.steps.some((step) => step.id === current)) {
            return current;
          }
          return payload.onboarding.nextAction?.stepId ?? payload.onboarding.steps[0]?.id ?? null;
        });
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load launch workspace.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (
      source !== "account_onboarding" ||
      !onboardingAccountId ||
      onboardingCurrentStep !== "open_launch_workspace"
    ) {
      return;
    }

    let cancelled = false;

    async function markLaunchOpened() {
      try {
        const supabase = createClient();
        await supabase
          .from("customer_account_onboarding")
          .update({
            current_step: "completed",
            completed_steps: Array.from(
              new Set([...completedSteps, "open_launch_workspace"])
            ),
            launch_workspace_opened_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            status: "completed",
          })
          .eq("customer_account_id", onboardingAccountId);

        await supabase.from("customer_account_events").insert({
          customer_account_id: onboardingAccountId,
          event_type: "launch_workspace_opened",
          metadata: {
            projectId: params.id,
          },
        });

        if (!cancelled) {
          setHandoffNotice(true);
          await accountEntry.refresh();
        }
      } catch {
        if (!cancelled) {
          setHandoffNotice(true);
        }
      }
    }

    void markLaunchOpened();

    return () => {
      cancelled = true;
    };
  }, [accountEntry.refresh, completedSteps, onboardingAccountId, onboardingCurrentStep, params.id, source]);

  const projectCampaignCount = useMemo(
    () => campaigns.filter((campaign) => campaign.projectId === project?.id).length,
    [campaigns, project?.id]
  );
  const projectQuestCount = useMemo(
    () => quests.filter((quest) => quest.projectId === project?.id).length,
    [project?.id, quests]
  );
  const projectRewardCount = useMemo(
    () => rewards.filter((reward) => reward.projectId === project?.id).length,
    [project?.id, rewards]
  );
  const primaryCampaignId = useMemo(() => {
    if (!project?.id) {
      return null;
    }

    const projectCampaigns = campaigns.filter((campaign) => campaign.projectId === project.id);
    return (
      projectCampaigns.find((campaign) => campaign.status === "active")?.id ??
      projectCampaigns[0]?.id ??
      null
    );
  }, [campaigns, project?.id]);
  const templateLibrarySections = useMemo(() => {
    if (!project) {
      return [];
    }

    return buildProjectBuilderLibrary({
      project: {
        id: project.id,
        name: project.name,
      },
      campaignId: primaryCampaignId,
      savedTemplates: projectBuilderTemplates.filter(
        (template) => template.projectId === project.id
      ),
    });
  }, [primaryCampaignId, project, projectBuilderTemplates]);

  const healthPills = useMemo(() => {
    if (!project) {
      return [];
    }

    return buildProjectWorkspaceHealthPills({
      project,
      campaignCount: snapshot?.facts.campaignCount ?? projectCampaignCount,
      questCount: snapshot?.facts.questCount ?? projectQuestCount,
      rewardCount: snapshot?.facts.rewardCount ?? projectRewardCount,
      operatorIncidentCount:
        snapshot?.readiness.ops.openIncidents ?? projectOps.openIncidents.length,
    });
  }, [
    project,
    projectCampaignCount,
    projectOps.openIncidents.length,
    projectQuestCount,
    projectRewardCount,
    snapshot,
  ]);

  const nextActions = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const actions = [
      snapshot.readiness.recommendedAction
        ? {
            title: snapshot.readiness.recommendedAction.title,
            summary: snapshot.readiness.recommendedAction.summary,
            href: snapshot.readiness.recommendedAction.href,
            tone: "primary" as const,
          }
        : null,
      snapshot.onboarding.nextAction
        ? {
            title: snapshot.onboarding.nextAction.title,
            summary: snapshot.onboarding.nextAction.summary,
            href: snapshot.onboarding.nextAction.href,
            tone: "default" as const,
          }
        : null,
      snapshot.facts.campaignCount === 0
        ? {
            title: "Open Campaign Studio",
            summary:
              "Create the first campaign so quests, raids and rewards have a launch spine.",
            href: `/campaigns/new?projectId=${snapshot.projectId}&source=launch`,
            tone: "default" as const,
          }
        : null,
      snapshot.facts.questCount + snapshot.facts.raidCount === 0
        ? {
            title: "Create the first mission",
            summary:
              "Give members a real action by creating a quest or a raid from this workspace.",
            href: `/quests/new?projectId=${snapshot.projectId}${primaryCampaignId ? `&campaignId=${primaryCampaignId}` : ""}&source=launch`,
            tone: "default" as const,
          }
        : null,
      snapshot.facts.rewardCount === 0
        ? {
            title: "Open Reward Studio",
            summary:
              "Add the first reward so launch has a clear payout, unlock, or recognition layer.",
            href: `/rewards/new?projectId=${snapshot.projectId}`,
            tone: "default" as const,
          }
        : null,
      snapshot.facts.testedProviderCount === 0
        ? {
            title: "Run a community push test",
            summary:
              "Use Community OS to send a live provider test before launch traffic starts moving.",
            href: `/projects/${snapshot.projectId}/community`,
            tone: "default" as const,
          }
        : null,
    ].filter(
      (action): action is { title: string; summary: string; href: string; tone: "primary" | "default" } =>
        Boolean(action)
    );

    return actions.filter(
      (action, index, array) =>
        array.findIndex((candidate) => candidate.href === action.href) === index
    );
  }, [snapshot]);

  if (!project) {
    return (
      <AdminShell>
        <NotFoundState
          title="Project workspace not found"
          description="We could not find a project for this launch rail."
          action={
            <Link
              href="/projects"
              className="rounded-[18px] border border-white/[0.026] bg-white/[0.016] px-4 py-3 text-sm font-bold text-text"
            >
              Back to projects
            </Link>
          }
        />
      </AdminShell>
    );
  }

  if (loading && !snapshot) {
    return (
      <AdminShell>
        <ProjectWorkspaceFrame
          projectId={project.id}
          projectName={project.name}
          projectChain={project.chain}
          healthPills={healthPills}
        >
          <LoadingState
            title="Loading launch workspace"
            description="Veltrix is collecting onboarding, readiness and operator signals for this project."
          />
        </ProjectWorkspaceFrame>
      </AdminShell>
    );
  }

  if (!snapshot) {
    return (
      <AdminShell>
        <ProjectWorkspaceFrame
          projectId={project.id}
          projectName={project.name}
          projectChain={project.chain}
          healthPills={healthPills}
        >
          <NotFoundState
            title="Launch workspace unavailable"
            description={error || "This project launch surface could not be loaded right now."}
            action={
              <Link
                href={`/projects/${project.id}`}
                className="rounded-[18px] border border-white/[0.026] bg-white/[0.016] px-4 py-3 text-sm font-bold text-text"
              >
                Back to project overview
              </Link>
            }
          />
        </ProjectWorkspaceFrame>
      </AdminShell>
    );
  }

  return (
    <ProjectWorkspaceFrame
        projectId={project.id}
        projectName={project.name}
        projectChain={project.chain}
        healthPills={healthPills}
      >
        {handoffNotice ? (
          <OpsPanel
            eyebrow="Account handoff"
            title="The first project is now inside Launch"
            description="The project is now in the guided launch workspace. Finish the required steps first, then add recommended polish before going live."
            tone="accent"
          >
            <div className="flex flex-wrap gap-3">
              <OpsStatusPill tone="success">Launch workspace opened</OpsStatusPill>
              <OpsStatusPill tone="warning">Next steps visible</OpsStatusPill>
            </div>
          </OpsPanel>
        ) : null}

        <ProjectLaunchCommandDeck
          projectName={project.name}
          snapshot={snapshot}
          view={view}
          onViewChange={setView}
          primaryAction={nextActions[0] ?? null}
        />

        <div className="grid gap-3 xl:grid-cols-[260px,minmax(0,1fr)] xl:items-start">
          <ProjectLaunchRail
            steps={snapshot.onboarding.steps}
            activeStepId={activeStepId}
            completionRatio={snapshot.onboarding.completionRatio}
            onSelect={setActiveStepId}
          />

          <div className="space-y-3">
            <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] 2xl:items-start">
              <OpsPanel
                eyebrow={view === "setup" ? "Setup checklist" : "Launch checklist"}
                title={
                  view === "setup"
                    ? "Finish the setup steps in the right order"
                    : "Read the launch blockers before going live"
                }
                description={
                  view === "setup"
                    ? "Use this board to focus one setup decision at a time and keep the project moving."
                    : "This is the launch-facing view of the same project state, grouped into blockers and readiness groups."
                }
              >
                <ProjectLaunchChecklist
                  view={view}
                  steps={snapshot.onboarding.steps}
                  activeStepId={activeStepId}
                  hardBlockers={snapshot.readiness.hardBlockers}
                  softBlockers={snapshot.readiness.softBlockers}
                  groups={snapshot.readiness.groups}
                />
              </OpsPanel>

              <ProjectNextActions
                actions={nextActions}
                supportLinks={[
                  {
                    label: "Open Reward Studio",
                    description:
                      "Add a reward from the same project context so claims and recognition are wired before launch.",
                    href: `/rewards/new?projectId=${project.id}`,
                  },
                  {
                    label: "Open Community OS",
                    description:
                      "Configure channels, commands, test pushes and community workflows in one place.",
                    href: `/projects/${project.id}/community`,
                  },
                  {
                    label: "Open Campaign Studio",
                    description:
                      "Start or extend the campaign architecture with this project already loaded.",
                      href: `/campaigns/new?projectId=${project.id}&source=launch`,
                  },
                  {
                    label: "Open Quest Studio",
                    description:
                      "Build the next member action directly in this project workspace.",
                      href: `/quests/new?projectId=${project.id}${primaryCampaignId ? `&campaignId=${primaryCampaignId}` : ""}&source=launch`,
                  },
                  {
                    label: "Open Raid Builder",
                    description:
                      "Add live pressure missions that tie directly into the campaign and community workflows.",
                      href: `/raids/new?projectId=${project.id}${primaryCampaignId ? `&campaignId=${primaryCampaignId}` : ""}&source=launch`,
                  },
                ]}
              />
            </div>

            <OpsPanel
              eyebrow="Readiness groups"
              title="Why the launch score looks this way"
              description="A compact read of the signals that matter before the project goes live."
            >
              <div className="grid gap-2 xl:items-start xl:grid-cols-3">
                {snapshot.readiness.groups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-[14px] bg-white/[0.014] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] font-semibold text-text">{group.title}</p>
                      <OpsStatusPill
                        tone={
                          group.status === "ready"
                            ? "success"
                            : group.status === "watching"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {group.status}
                      </OpsStatusPill>
                    </div>
                    <div className="mt-2.5 grid gap-1.5">
                      <OpsSnapshotRow label="Group score" value={`${group.score}/100`} />
                      <OpsSnapshotRow label="Reading" value={group.summary} />
                    </div>
                  </div>
                ))}
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Launch routes"
              title="Pick a proven route when you need content"
              description="Campaign packs, quest kits, raid kits and playbooks are kept secondary so the launch checklist stays the main surface."
              className="border-white/[0.02]"
            >
              <ProjectTemplateLibrary sections={templateLibrarySections} layout="wide" />
            </OpsPanel>

            <div className="grid gap-3 2xl:grid-cols-2 2xl:items-start">
              <OpsPanel
                eyebrow="Incident board"
                title="Open launch incidents"
                description="Phase 1 operator incidents stay visible here so launch readiness is never blind."
              >
                <OpsIncidentPanel
                  incidents={projectOps.openIncidents}
                  workingIncidentId={projectOps.workingIncidentId}
                  onUpdateStatus={projectOps.updateIncidentStatus}
                  emptyTitle="No launch incidents"
                  emptyDescription="This project currently has no open or watching incidents."
                />
              </OpsPanel>

              <OpsPanel
                eyebrow="Override board"
                title="Active launch overrides"
                description="Pause, mute, skip and manual-complete overrides are part of launch posture now."
              >
                <OpsOverridePanel
                  overrides={projectOps.activeOverrides}
                  workingOverrideId={projectOps.workingOverrideId}
                  onResolveOverride={projectOps.resolveOverride}
                  emptyTitle="No active launch overrides"
                  emptyDescription="This project is not currently running on temporary overrides."
                />
              </OpsPanel>
            </div>
          </div>
        </div>
      </ProjectWorkspaceFrame>
  );
}

function labelForTier(tier: LaunchTier) {
  if (tier === "live_ready") return "Live ready";
  if (tier === "launchable") return "Launchable";
  if (tier === "warming_up") return "Warming up";
  return "Blocked";
}

function toneForTier(tier: LaunchTier) {
  if (tier === "live_ready") return "success" as const;
  if (tier === "launchable") return "warning" as const;
  if (tier === "warming_up") return "warning" as const;
  return "danger" as const;
}

function ProjectLaunchCommandDeck({
  projectName,
  snapshot,
  view,
  onViewChange,
  primaryAction,
}: {
  projectName: string;
  snapshot: LaunchSnapshot;
  view: LaunchWorkspaceView;
  onViewChange: (next: LaunchWorkspaceView) => void;
  primaryAction: {
    title: string;
    summary: string;
    href: string;
    tone: "primary" | "default";
  } | null;
}) {
  const completionPercent = Math.round(snapshot.onboarding.completionRatio * 100);
  const incidentCount = snapshot.readiness.ops.openIncidents;
  const hardBlockerCount = snapshot.readiness.hardBlockers.length;
  const nextTitle =
    primaryAction?.title ??
    snapshot.onboarding.nextAction?.title ??
    "Review launch posture";

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-white/[0.024] bg-[radial-gradient(circle_at_8%_0%,rgba(199,255,0,0.09),transparent_26%),radial-gradient(circle_at_88%_10%,rgba(0,255,163,0.06),transparent_24%),linear-gradient(180deg,rgba(11,14,20,0.985),rgba(7,9,14,0.965))] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.09),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[length:64px_64px] opacity-[0.32]" />

      <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.38fr)] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <OpsStatusPill tone={toneForTier(snapshot.readiness.tier)}>
              {labelForTier(snapshot.readiness.tier)}
            </OpsStatusPill>
            <OpsStatusPill tone={incidentCount > 0 ? "warning" : "success"}>
              {incidentCount > 0 ? `${incidentCount} incident${incidentCount === 1 ? "" : "s"}` : "No incidents"}
            </OpsStatusPill>
          </div>
          <h1 className="mt-3 text-[1.24rem] font-semibold tracking-[-0.035em] text-text md:text-[1.55rem]">
            Launch {projectName} from one command surface
          </h1>
          <p className="mt-2 max-w-4xl text-[12px] leading-5 text-sub">
            Finish required setup first, then choose the exact studio that closes the next launch gap.
          </p>

          <div className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            <LaunchCommandMetric
              icon={<Gauge size={15} />}
              label="Launch score"
              value={`${snapshot.readiness.score}/100`}
              tone={snapshot.readiness.score >= 85 ? "success" : snapshot.readiness.score >= 65 ? "warning" : "default"}
            />
            <LaunchCommandMetric
              icon={<CheckCircle2 size={15} />}
              label="Setup"
              value={`${completionPercent}%`}
              tone={completionPercent >= 75 ? "success" : "warning"}
            />
            <LaunchCommandMetric
              icon={<ShieldAlert size={15} />}
              label="Blockers"
              value={`${hardBlockerCount} hard`}
              tone={hardBlockerCount > 0 ? "danger" : "success"}
            />
            <LaunchCommandMetric
              icon={<Rocket size={15} />}
              label="Next move"
              value={nextTitle}
              tone="default"
            />
          </div>
        </div>

        <div className="rounded-[18px] border border-white/[0.026] bg-black/25 p-3.5">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">
            Working mode
          </p>
          <div className="mt-2">
            <SegmentToggle value={view} options={[...VIEW_OPTIONS]} onChange={onViewChange} />
          </div>

          <div className="mt-3 rounded-[15px] border border-white/[0.024] bg-white/[0.014] p-3">
            <p className="text-[12px] font-semibold text-text">{nextTitle}</p>
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-sub">
              {primaryAction?.summary ??
                snapshot.onboarding.nextAction?.summary ??
                "Switch between setup and launch blockers to decide the next move."}
            </p>
            {primaryAction ? (
              <Link
                href={primaryAction.href}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-[12px] font-black text-black transition hover:brightness-105"
              >
                Open next move
                <ArrowUpRight size={13} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function LaunchCommandMetric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "default" | "success" | "warning" | "danger";
}) {
  return (
    <div className="rounded-[15px] border border-white/[0.024] bg-white/[0.014] px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
        <span
          className={
            tone === "success"
              ? "text-emerald-200"
              : tone === "warning"
                ? "text-amber-200"
                : tone === "danger"
                  ? "text-rose-200"
                  : "text-primary"
          }
        >
          {icon}
        </span>
      </div>
      <p className="mt-1.5 truncate text-[13px] font-semibold text-text">{value}</p>
    </div>
  );
}

export default function ProjectLaunchPage() {
  return (
    <AdminShell>
      <ProjectLaunchContent />
    </AdminShell>
  );
}
