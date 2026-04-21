"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectWorkspaceFrame from "@/components/layout/shell/ProjectWorkspaceFrame";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsHero,
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { LoadingState, NotFoundState } from "@/components/layout/state/StatePrimitives";
import ProjectLaunchChecklist from "@/components/projects/launch/ProjectLaunchChecklist";
import ProjectLaunchRail from "@/components/projects/launch/ProjectLaunchRail";
import ProjectLaunchScorecard from "@/components/projects/launch/ProjectLaunchScorecard";
import ProjectNextActions from "@/components/projects/launch/ProjectNextActions";
import ProjectTemplateLibrary from "@/components/projects/templates/ProjectTemplateLibrary";
import OpsIncidentPanel from "@/components/platform/OpsIncidentPanel";
import OpsOverridePanel from "@/components/platform/OpsOverridePanel";
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

export default function ProjectLaunchPage() {
  const params = useParams<{ id: string }>();
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

  const projectOps = useProjectOps(project?.id);

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
              className="rounded-[18px] border border-line bg-card2 px-4 py-3 text-sm font-bold text-text"
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
                className="rounded-[18px] border border-line bg-card2 px-4 py-3 text-sm font-bold text-text"
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
    <AdminShell>
      <ProjectWorkspaceFrame
        projectId={project.id}
        projectName={project.name}
        projectChain={project.chain}
        healthPills={healthPills}
      >
        <OpsHero
          eyebrow="Project launch workspace"
          title={`Bring ${project.name} from setup into launch posture`}
          description="This is the calm operating surface for onboarding, readiness, first content and launch pressure. It keeps the project team on one clear spine instead of scattering setup across the portal."
          aside={
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">
                Workspace focus
              </p>
              <SegmentToggle
                value={view}
                options={[...VIEW_OPTIONS]}
                onChange={setView}
              />
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
          <ProjectLaunchRail
            steps={snapshot.onboarding.steps}
            activeStepId={activeStepId}
            completionRatio={snapshot.onboarding.completionRatio}
            onSelect={setActiveStepId}
          />

          <div className="space-y-6">
            <ProjectLaunchScorecard
              score={snapshot.readiness.score}
              tier={snapshot.readiness.tier}
              completionRatio={snapshot.onboarding.completionRatio}
              completedSteps={snapshot.onboarding.completedSteps}
              totalSteps={snapshot.onboarding.totalSteps}
              openIncidents={snapshot.readiness.ops.openIncidents}
              criticalIncidents={snapshot.readiness.ops.criticalIncidents}
              activeOverrides={snapshot.readiness.ops.activeOverrides}
            />

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
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
              eyebrow="Starter library"
              title="Start from intent, not from a blank builder"
              description="Open a proven campaign pack, a quest kit, a raid kit or a launch playbook with this project already wired in."
            >
              <ProjectTemplateLibrary sections={templateLibrarySections} />
            </OpsPanel>

            <OpsPanel
              eyebrow="Readiness groups"
              title="Why the score looks the way it does"
              description="Each group below is a high-signal read on the parts of the project that most affect launch quality."
            >
              <div className="grid gap-4 xl:grid-cols-3">
                {snapshot.readiness.groups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-text">{group.title}</p>
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
                    <div className="mt-4 grid gap-3">
                      <OpsSnapshotRow label="Group score" value={`${group.score}/100`} />
                      <OpsSnapshotRow label="Reading" value={group.summary} />
                    </div>
                  </div>
                ))}
              </div>
            </OpsPanel>

            <div className="grid gap-6 2xl:grid-cols-2">
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
    </AdminShell>
  );
}
