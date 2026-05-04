"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BuilderBottomNav,
  BuilderMetricCard,
  BuilderSidebarCard,
  BuilderStepHeader,
} from "@/components/layout/builder/BuilderPrimitives";
import CampaignIntentStep from "@/components/forms/campaign/CampaignIntentStep";
import CampaignLaunchPreview from "@/components/forms/campaign/CampaignLaunchPreview";
import CampaignMissionMap from "@/components/forms/campaign/CampaignMissionMap";
import CampaignStoryboardCanvas from "@/components/forms/campaign/CampaignStoryboardCanvas";
import CampaignStoryboardInspector from "@/components/forms/campaign/CampaignStoryboardInspector";
import StudioEntryCommandDeck from "@/components/forms/studio/StudioEntryCommandDeck";
import StudioModeToggle from "@/components/forms/studio/StudioModeToggle";
import StudioPreviewCard from "@/components/forms/studio/StudioPreviewCard";
import StudioShell from "@/components/forms/studio/StudioShell";
import StudioStepRail from "@/components/forms/studio/StudioStepRail";
import StudioTopFrame from "@/components/forms/studio/StudioTopFrame";
import StudioWarningRail from "@/components/forms/studio/StudioWarningRail";
import AdminShell from "@/components/layout/shell/AdminShell";
import CampaignForm from "@/components/forms/campaign/CampaignForm";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import {
  buildCampaignTemplate,
  CampaignTemplateId,
  CampaignTemplateOption,
  formatProjectFieldLabel,
  getRecommendedCampaignTemplateOptions,
  ResolvedQuestDraft,
  ResolvedRewardDraft,
} from "@/lib/campaign-templates";
import {
  CampaignStudioAudienceId,
  CampaignStudioIntentId,
  getCampaignLaunchPreview,
  getCampaignMissionMap,
  getCampaignStudioCompactReadiness,
  getCampaignStudioIntentState,
} from "@/lib/studio/campaign-studio";
import {
  type CampaignStoryboardBlockId,
  getCampaignStoryboard,
  getCampaignStoryboardBlock,
  getCampaignStoryboardWarnings,
} from "@/lib/studio/campaign-storyboard";
import { AdminProject } from "@/types/entities/project";
import { AdminQuest } from "@/types/entities/quest";
import { AdminReward } from "@/types/entities/reward";

type EditableProjectContextField =
  | "website"
  | "xUrl"
  | "telegramUrl"
  | "discordUrl"
  | "bannerUrl"
  | "docsUrl"
  | "waitlistUrl"
  | "launchPostUrl"
  | "tokenContractAddress"
  | "nftContractAddress"
  | "primaryWallet"
  | "brandAccent"
  | "brandMood"
  | "contactEmail";

type EditableQuestDraft = Pick<
  AdminQuest,
  "title" | "description" | "xp" | "actionUrl" | "actionLabel"
>;

type EditableRewardDraft = Pick<AdminReward, "title" | "description" | "cost">;

type SavedTemplateConfiguration = {
  baseTemplateId: CampaignTemplateId;
  selectedQuestKeys: string[];
  selectedRewardKeys: string[];
  questDraftEdits: Record<string, Partial<EditableQuestDraft>>;
  rewardDraftEdits: Record<string, Partial<EditableRewardDraft>>;
};

type SelectedTemplateId = CampaignTemplateId | null;
type BuilderStepId = "template" | "custom" | "autofill" | "flow" | "launch";

const baseBuilderSteps: Array<{
  id: BuilderStepId;
  label: string;
  description: string;
}> = [
  {
    id: "template",
    label: "Playbook",
    description: "Choose the full campaign template or a saved project variant that fits this workspace best.",
  },
  {
    id: "custom",
    label: "Custom path",
    description: "Define the direction for a custom campaign path before you continue into setup and launch.",
  },
  {
    id: "autofill",
    label: "Context",
    description: "See what Veltrix can autofill already and patch the missing project context inline.",
  },
  {
    id: "flow",
    label: "Storyboard",
    description: "Review the generated quests and rewards, then include, skip, or refine the drafts.",
  },
  {
    id: "launch",
    label: "Launch",
    description: "Save this setup as a reusable template variant and generate the campaign when it feels right.",
  },
];

function NewCampaignPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
  const createCampaign = useAdminPortalStore((s) => s.createCampaign);
  const createQuest = useAdminPortalStore((s) => s.createQuest);
  const createReward = useAdminPortalStore((s) => s.createReward);
  const createProjectCampaignTemplate = useAdminPortalStore(
    (s) => s.createProjectCampaignTemplate
  );
  const deleteProjectCampaignTemplate = useAdminPortalStore(
    (s) => s.deleteProjectCampaignTemplate
  );
  const updateProject = useAdminPortalStore((s) => s.updateProject);
  const projectCampaignTemplates = useAdminPortalStore(
    (s) => s.projectCampaignTemplates
  );
  const projects = useAdminPortalStore((s) => s.projects);
  const requestedProjectId = searchParams.get("projectId") || undefined;
  const requestedTemplateId = searchParams.get("templateId") || undefined;
  const requestedSavedTemplateId = searchParams.get("savedTemplateId") || undefined;
  const entrySource = searchParams.get("source") || "direct";

  const [selectedTemplateId, setSelectedTemplateId] =
    useState<SelectedTemplateId>(null);
  const [selectedQuestKeys, setSelectedQuestKeys] = useState<string[]>([]);
  const [selectedRewardKeys, setSelectedRewardKeys] = useState<string[]>([]);
  const [projectContextDraft, setProjectContextDraft] = useState<
    Partial<Pick<AdminProject, EditableProjectContextField>>
  >({});
  const [questDraftEdits, setQuestDraftEdits] = useState<
    Record<string, Partial<EditableQuestDraft>>
  >({});
  const [rewardDraftEdits, setRewardDraftEdits] = useState<
    Record<string, Partial<EditableRewardDraft>>
  >({});
  const [contextSaving, setContextSaving] = useState(false);
  const [contextMessage, setContextMessage] = useState<string | null>(null);
  const [savedTemplateName, setSavedTemplateName] = useState("");
  const [savedTemplateDescription, setSavedTemplateDescription] = useState("");
  const [savedTemplateMessage, setSavedTemplateMessage] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [pendingSavedTemplateConfig, setPendingSavedTemplateConfig] =
    useState<SavedTemplateConfiguration | null>(null);
  const [currentStep, setCurrentStep] = useState<BuilderStepId>("template");
  const [visitedSteps, setVisitedSteps] = useState<BuilderStepId[]>(["template"]);
  const [campaignTitleDraft, setCampaignTitleDraft] = useState("");
  const [stepError, setStepError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);
  const [generatedCampaign, setGeneratedCampaign] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [customPlaybookSummary, setCustomPlaybookSummary] = useState("");
  const [customPlaybookGoal, setCustomPlaybookGoal] = useState("");
  const [expandedQuestKeys, setExpandedQuestKeys] = useState<string[]>([]);
  const [expandedRewardKeys, setExpandedRewardKeys] = useState<string[]>([]);
  const [studioLens, setStudioLens] = useState<"strategy" | "launch">("strategy");
  const [selectedIntent, setSelectedIntent] = useState<CampaignStudioIntentId>("hybrid_launch");
  const [selectedAudience, setSelectedAudience] = useState<CampaignStudioAudienceId>("mixed");
  const [selectedStoryboardBlockId, setSelectedStoryboardBlockId] =
    useState<CampaignStoryboardBlockId>("goal");
  const [searchSeedApplied, setSearchSeedApplied] = useState(false);

  const selectedProject = useMemo(
    () =>
      projects.find((project) => project.id === (requestedProjectId || activeProjectId)) ??
      projects[0] ??
      null,
    [activeProjectId, projects, requestedProjectId]
  );
  const effectiveProject = useMemo(
    () =>
      selectedProject
        ? {
            ...selectedProject,
            ...projectContextDraft,
          }
        : null,
    [projectContextDraft, selectedProject]
  );
  const entrySourceLabel =
    entrySource === "launch"
      ? "Launch Workspace"
      : entrySource === "campaign-board"
        ? "Campaign Board"
        : entrySource === "project-overview"
          ? "Project Overview"
          : undefined;
  const returnHref =
    selectedProject?.id && entrySource === "launch"
      ? `/projects/${selectedProject.id}/launch`
      : selectedProject?.id && entrySource === "campaign-board"
        ? `/projects/${selectedProject.id}/campaigns`
        : selectedProject?.id && entrySource === "project-overview"
          ? `/projects/${selectedProject.id}`
          : null;

  const templateOptions = useMemo(
    () => getRecommendedCampaignTemplateOptions(effectiveProject),
    [effectiveProject]
  );
  const savedProjectTemplates = useMemo(
    () =>
      projectCampaignTemplates.filter(
        (template) => template.projectId === selectedProject?.id
      ),
    [projectCampaignTemplates, selectedProject?.id]
  );
  const templatePlan = useMemo(
    () =>
      effectiveProject && selectedTemplateId
        ? buildCampaignTemplate(effectiveProject, selectedTemplateId)
        : null,
    [effectiveProject, selectedTemplateId]
  );
  const persistedTemplatePlan = useMemo(
    () =>
      selectedProject && selectedTemplateId
        ? buildCampaignTemplate(selectedProject, selectedTemplateId)
        : null,
    [selectedProject, selectedTemplateId]
  );

  const selectedTemplate = templateOptions.find(
    (template) => template.id === selectedTemplateId
  );
  const inferredIntentState = useMemo(
    () => getCampaignStudioIntentState({ selectedTemplate }),
    [selectedTemplate]
  );
  const featuredTemplate = templateOptions[0] ?? null;
  const secondaryTemplates = templateOptions.filter(
    (template) => template.id !== featuredTemplate?.id
  );
  const builderSteps = useMemo(
    () =>
      baseBuilderSteps.filter((step) =>
        selectedTemplateId === "blank_campaign_canvas" ? true : step.id !== "custom"
      ),
    [selectedTemplateId]
  );
  const currentStepIndex = builderSteps.findIndex((step) => step.id === currentStep);
  const currentStepMeta = builderSteps[currentStepIndex];
  const previousStep = builderSteps[currentStepIndex - 1];
  const nextStep = builderSteps[currentStepIndex + 1];
  const progressPercent = Math.round(((currentStepIndex + 1) / builderSteps.length) * 100);
  const storyboardStepItems = useMemo(
    () =>
      builderSteps.map((step, index) => ({
        id: step.id,
        label: step.label,
        shortLabel: String(index + 1),
        complete:
          visitedSteps.includes(step.id) &&
          builderSteps.findIndex((item) => item.id === step.id) < currentStepIndex,
      })),
    [builderSteps, currentStepIndex, visitedSteps]
  );

  useEffect(() => {
    if (!requestedProjectId) return;
    const projectExists = projects.some((project) => project.id === requestedProjectId);
    if (projectExists && activeProjectId !== requestedProjectId) {
      setActiveProjectId(requestedProjectId);
    }
  }, [activeProjectId, projects, requestedProjectId, setActiveProjectId]);

  useEffect(() => {
    setVisitedSteps((current) =>
      current.includes(currentStep) ? current : [...current, currentStep]
    );
    setStepError(null);
  }, [currentStep]);

  useEffect(() => {
    if (searchSeedApplied) {
      return;
    }

    if (requestedSavedTemplateId) {
      const savedTemplate = savedProjectTemplates.find(
        (template) => template.id === requestedSavedTemplateId
      );
      if (!savedTemplate) {
        return;
      }

      applySavedTemplate(savedTemplate.configuration);
      setCurrentStep("autofill");
      setSearchSeedApplied(true);
      return;
    }

    if (requestedTemplateId) {
      const hasTemplate = templateOptions.some(
        (template) => template.id === requestedTemplateId
      );
      if (!hasTemplate) {
        return;
      }

      chooseTemplate(requestedTemplateId as CampaignTemplateId);
      setSearchSeedApplied(true);
      return;
    }

    setSearchSeedApplied(true);
  }, [
    requestedSavedTemplateId,
    requestedTemplateId,
    savedProjectTemplates,
    searchSeedApplied,
    templateOptions,
  ]);

  useEffect(() => {
    if (!builderSteps.some((step) => step.id === currentStep)) {
      setCurrentStep("template");
    }
  }, [builderSteps, currentStep]);

  useEffect(() => {
    setProjectContextDraft({});
    setQuestDraftEdits({});
    setRewardDraftEdits({});
    setContextMessage(null);
    setSavedTemplateMessage(null);
    setCustomPlaybookSummary("");
    setCustomPlaybookGoal("");
    setExpandedQuestKeys([]);
    setExpandedRewardKeys([]);
  }, [selectedProject?.id, selectedTemplateId]);

  useEffect(() => {
    setSelectedIntent(inferredIntentState.intentId);
    setSelectedAudience(inferredIntentState.audienceId);
  }, [inferredIntentState.audienceId, inferredIntentState.intentId]);

  useEffect(() => {
    setCampaignTitleDraft(templatePlan?.campaignDraft.title ?? "");
  }, [templatePlan?.campaignDraft.title]);

  useEffect(() => {
    setSelectedQuestKeys(templatePlan?.questDrafts.map((quest) => quest.key) ?? []);
    setSelectedRewardKeys(templatePlan?.rewardDrafts.map((reward) => reward.key) ?? []);
  }, [templatePlan]);

  useEffect(() => {
    if (currentStep === "template" || currentStep === "custom") {
      setSelectedStoryboardBlockId("goal");
      return;
    }

    if (currentStep === "autofill") {
      setSelectedStoryboardBlockId("launch_posture");
      return;
    }

    if (currentStep === "flow") {
      setSelectedStoryboardBlockId("quest_lane");
      return;
    }

    if (currentStep === "launch") {
      setSelectedStoryboardBlockId("launch_posture");
    }
  }, [currentStep]);

  useEffect(() => {
    if (!pendingSavedTemplateConfig || !templatePlan) return;

    setSelectedQuestKeys(
      pendingSavedTemplateConfig.selectedQuestKeys.length > 0
        ? pendingSavedTemplateConfig.selectedQuestKeys
        : templatePlan.questDrafts.map((quest) => quest.key)
    );
    setSelectedRewardKeys(
      pendingSavedTemplateConfig.selectedRewardKeys.length > 0
        ? pendingSavedTemplateConfig.selectedRewardKeys
        : templatePlan.rewardDrafts.map((reward) => reward.key)
    );
    setQuestDraftEdits(pendingSavedTemplateConfig.questDraftEdits ?? {});
    setRewardDraftEdits(pendingSavedTemplateConfig.rewardDraftEdits ?? {});
    setPendingSavedTemplateConfig(null);
  }, [pendingSavedTemplateConfig, templatePlan]);

  const includedQuestDrafts = useMemo(
    () =>
      templatePlan?.questDrafts
        .map((quest) => ({
          ...quest,
          draft: {
            ...quest.draft,
            ...(questDraftEdits[quest.key] ?? {}),
          },
        }))
        .filter((quest) => selectedQuestKeys.includes(quest.key)) ?? [],
    [questDraftEdits, selectedQuestKeys, templatePlan]
  );
  const includedRewardDrafts = useMemo(
    () =>
      templatePlan?.rewardDrafts
        .map((reward) => ({
          ...reward,
          draft: {
            ...reward.draft,
            ...(rewardDraftEdits[reward.key] ?? {}),
          },
        }))
        .filter((reward) => selectedRewardKeys.includes(reward.key)) ?? [],
    [rewardDraftEdits, selectedRewardKeys, templatePlan]
  );
  const editedQuestCount = Object.values(questDraftEdits).filter(
    (draft) => Object.keys(draft).length > 0
  ).length;
  const editedRewardCount = Object.values(rewardDraftEdits).filter(
    (draft) => Object.keys(draft).length > 0
  ).length;
  const contextSections = useMemo(() => {
    if (!effectiveProject) return [];

    const sections: Array<{ title: string; description: string; value: string }> = [];

    if (effectiveProject.launchPostUrl) {
      sections.push({
        title: "Launch Context",
        description: "The official launch post is set, so launch templates can route users to the exact social moment.",
        value: effectiveProject.launchPostUrl,
      });
    }

    if (effectiveProject.docsUrl) {
      sections.push({
        title: "Research Context",
        description: "Docs are connected, which helps creator and education-heavy templates auto-wire better research flows.",
        value: effectiveProject.docsUrl,
      });
    }

    if (effectiveProject.waitlistUrl) {
      sections.push({
        title: "Conversion Context",
        description: "The waitlist URL is connected, so referral and launch loops can point users straight at the conversion destination.",
        value: effectiveProject.waitlistUrl,
      });
    }

    if (effectiveProject.tokenContractAddress) {
      sections.push({
        title: "Holder Context",
        description: "Token contract data is available, so wallet-first templates can set up onchain checks with less manual work.",
        value: effectiveProject.tokenContractAddress,
      });
    }

    return sections;
  }, [effectiveProject]);
  const currentMissingContextFields = templatePlan?.missingProjectFields ?? [];
  const persistedMissingContextFields =
    persistedTemplatePlan?.missingProjectFields ?? [];
  const editableContextFields = useMemo(() => {
    const draftKeys = Object.keys(projectContextDraft).filter(
      (key) => key in projectContextDraft
    ) as EditableProjectContextField[];

    return Array.from(
      new Set<EditableProjectContextField>([
        ...(persistedMissingContextFields as EditableProjectContextField[]),
        ...draftKeys,
      ])
    );
  }, [persistedMissingContextFields, projectContextDraft]);
  const missionMap = useMemo(
    () =>
      getCampaignMissionMap({
        project: effectiveProject,
        templatePlan,
        selectedQuestKeys,
        selectedRewardKeys,
      }),
    [effectiveProject, selectedQuestKeys, selectedRewardKeys, templatePlan]
  );
  const launchPreview = useMemo(
    () =>
      getCampaignLaunchPreview({
        project: effectiveProject,
        templatePlan,
        selectedQuestKeys,
        selectedRewardKeys,
      }),
    [effectiveProject, selectedQuestKeys, selectedRewardKeys, templatePlan]
  );
  const compactReadiness = useMemo(
    () =>
      getCampaignStudioCompactReadiness({
        project: effectiveProject,
        templatePlan,
        selectedQuestKeys,
        selectedRewardKeys,
      }),
    [effectiveProject, selectedQuestKeys, selectedRewardKeys, templatePlan]
  );
  const storyboardBlocks = useMemo(
    () =>
      templatePlan && selectedTemplate
        ? getCampaignStoryboard({
            project: effectiveProject,
            templatePlan,
            templateId: selectedTemplate.id,
            selectedQuestKeys,
            selectedRewardKeys,
            intentLabel: inferredIntentState.intent.label,
            audienceLabel: inferredIntentState.audience.label,
          })
        : [],
    [
      effectiveProject,
      inferredIntentState.audience.label,
      inferredIntentState.intent.label,
      selectedQuestKeys,
      selectedRewardKeys,
      selectedTemplate,
      templatePlan,
    ]
  );
  const selectedStoryboardBlock = useMemo(
    () => getCampaignStoryboardBlock(storyboardBlocks, selectedStoryboardBlockId),
    [selectedStoryboardBlockId, storyboardBlocks]
  );
  const storyboardWarnings = useMemo(() => {
    const items = [
      ...getCampaignStoryboardWarnings(storyboardBlocks),
      ...compactReadiness.map((item) => ({
        label: item.label,
        description: item.value,
        tone: "warning" as const,
      })),
    ];

    return items.filter(
      (item, index, list) => list.findIndex((candidate) => candidate.label === item.label) === index
    );
  }, [compactReadiness, storyboardBlocks]);

  function updateQuestDraftEdit(
    key: string,
    field: keyof EditableQuestDraft,
    value: string | number
  ) {
    setQuestDraftEdits((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? {}),
        [field]: value,
      },
    }));
  }

  function updateRewardDraftEdit(
    key: string,
    field: keyof EditableRewardDraft,
    value: string | number
  ) {
    setRewardDraftEdits((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? {}),
        [field]: value,
      },
    }));
  }

  async function saveProjectContextFields() {
    if (!selectedProject || Object.keys(projectContextDraft).length === 0) {
      return;
    }

    const nextProject = {
      ...selectedProject,
      ...projectContextDraft,
    };

    setContextSaving(true);
    setContextMessage(null);

    try {
      await updateProject(selectedProject.id, {
        name: nextProject.name,
        slug: nextProject.slug,
        chain: nextProject.chain,
        category: nextProject.category ?? "",
        status: nextProject.status,
        onboardingStatus: nextProject.onboardingStatus,
        description: nextProject.description,
        longDescription: nextProject.longDescription ?? "",
        members: nextProject.members,
        campaigns: nextProject.campaigns,
        logo: nextProject.logo,
        bannerUrl: nextProject.bannerUrl ?? "",
        website: nextProject.website ?? "",
        xUrl: nextProject.xUrl ?? "",
        telegramUrl: nextProject.telegramUrl ?? "",
        discordUrl: nextProject.discordUrl ?? "",
        docsUrl: nextProject.docsUrl ?? "",
        waitlistUrl: nextProject.waitlistUrl ?? "",
        launchPostUrl: nextProject.launchPostUrl ?? "",
        tokenContractAddress: nextProject.tokenContractAddress ?? "",
        nftContractAddress: nextProject.nftContractAddress ?? "",
        primaryWallet: nextProject.primaryWallet ?? "",
        brandAccent: nextProject.brandAccent ?? "",
        brandMood: nextProject.brandMood ?? "",
        contactEmail: nextProject.contactEmail ?? "",
        isFeatured: nextProject.isFeatured ?? false,
        isPublic: nextProject.isPublic ?? true,
      });

      setProjectContextDraft({});
      setContextMessage("Project context updated. Template autofill refreshed.");
    } catch (error: any) {
      setContextMessage(error?.message || "Failed to update project context.");
    } finally {
      setContextSaving(false);
    }
  }

  async function saveCurrentTemplateVariant() {
    if (!selectedProject || !selectedTemplate) return;

    setSavingTemplate(true);
    setSavedTemplateMessage(null);

    try {
      await createProjectCampaignTemplate({
        projectId: selectedProject.id,
        name:
          savedTemplateName.trim() ||
          `${selectedTemplate.label} - ${selectedProject.name}`,
        description:
          savedTemplateDescription.trim() ||
          "Saved from the campaign builder with project-specific selections and edits.",
        baseTemplateId: selectedTemplate.id,
        configuration: JSON.stringify(
          {
            baseTemplateId: selectedTemplate.id,
            selectedQuestKeys,
            selectedRewardKeys,
            questDraftEdits,
            rewardDraftEdits,
          } satisfies SavedTemplateConfiguration,
          null,
          2
        ),
      });

      setSavedTemplateName("");
      setSavedTemplateDescription("");
      setSavedTemplateMessage("Saved as a reusable project template.");
    } catch (error: any) {
      setSavedTemplateMessage(
        error?.message || "Failed to save the project template."
      );
    } finally {
      setSavingTemplate(false);
    }
  }

  function applySavedTemplate(configurationRaw: string) {
    try {
      const parsed = JSON.parse(configurationRaw) as SavedTemplateConfiguration;
      setSelectedTemplateId(parsed.baseTemplateId);
      setPendingSavedTemplateConfig(parsed);
      setSavedTemplateMessage("Saved project variant loaded.");
    } catch {
      setSavedTemplateMessage("This saved template could not be parsed.");
    }
  }

  function chooseTemplate(templateId: CampaignTemplateId) {
    setSelectedTemplateId(templateId);
    setVisitedSteps(["template"]);
    setCurrentStep(templateId === "blank_campaign_canvas" ? "custom" : "autofill");
  }

  function validateCurrentStep(step: BuilderStepId) {
    if (step === "template" && !selectedTemplateId) {
      return "Choose a playbook or blank campaign canvas before continuing.";
    }

    if (
      step === "custom" &&
      selectedTemplateId === "blank_campaign_canvas" &&
      !campaignTitleDraft.trim()
    ) {
      return "Give your custom playbook a campaign title before continuing.";
    }

    if (step === "autofill" && currentMissingContextFields.length > 0) {
      return `Add the missing workspace context first: ${currentMissingContextFields
        .map((field) => formatProjectFieldLabel(field))
        .join(", ")}.`;
    }

    if (
      step === "flow" &&
      selectedTemplateId !== "blank_campaign_canvas" &&
      includedQuestDrafts.length + includedRewardDrafts.length === 0
    ) {
      return "Keep at least one generated draft, or switch to Blank Campaign Canvas for a fully custom setup.";
    }

    return null;
  }

  function attemptStepNavigation(targetStep: BuilderStepId) {
    const targetIndex = builderSteps.findIndex((step) => step.id === targetStep);

    if (targetIndex <= currentStepIndex) {
      setCurrentStep(targetStep);
      return;
    }

    for (let index = currentStepIndex; index < targetIndex; index += 1) {
      const step = builderSteps[index];
      const error = validateCurrentStep(step.id);
      if (error) {
        setStepError(error);
        setCurrentStep(step.id);
        return;
      }
    }

    setCurrentStep(targetStep);
  }

  function renderWorkspaceContextEditor() {
    if (!selectedTemplate) {
      return (
        <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.018] p-5">
          <p className="text-sm leading-7 text-sub">
            Pick a playbook first so Veltrix can show which workspace links and brand fields the
            campaign needs.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.018] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Workspace context usage
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedTemplate.requiredProjectFields.map((field) => (
              <span
                key={field}
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                  currentMissingContextFields.includes(field)
                    ? "bg-amber-500/[0.075] text-amber-300"
                    : "bg-primary/[0.075] text-primary"
                }`}
              >
                {formatProjectFieldLabel(field)}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-7 text-sub">
            Patch the missing workspace context here once, and future campaigns for this project
            get a much cleaner autofill path.
          </p>
        </div>

        {currentMissingContextFields.length > 0 ? (
          <div className="rounded-[18px] border border-white/[0.026] bg-black/20 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              {editableContextFields.map((field) => (
                <label key={field} className="block">
                  <span className="mb-2 block text-sm font-semibold text-text">
                    {formatProjectFieldLabel(field)}
                  </span>
                  <input
                    value={
                      projectContextDraft[field as EditableProjectContextField] ??
                      ((selectedProject?.[field as EditableProjectContextField] as string | undefined) ??
                        "")
                    }
                    onChange={(event) =>
                      setProjectContextDraft((current) => ({
                        ...current,
                        [field as EditableProjectContextField]: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
                    placeholder={`Add ${formatProjectFieldLabel(field)}`}
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveProjectContextFields}
                disabled={
                  contextSaving ||
                  !selectedProject ||
                  Object.keys(projectContextDraft).length === 0
                }
                className="rounded-2xl bg-primary px-4 py-3 font-bold text-black shadow-[0_12px_28px_rgba(141,255,89,0.18)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {contextSaving ? "Saving workspace context..." : "Save workspace context"}
              </button>
              {contextMessage ? <p className="text-sm text-sub">{contextMessage}</p> : null}
            </div>
          </div>
        ) : (
          <div className="rounded-[18px] border border-emerald-500/30 bg-emerald-500/10 p-5">
            <p className="text-sm leading-7 text-emerald-100">
              All required workspace fields are already present. This campaign can move into the
              generated journey with a clean autofill posture.
            </p>
          </div>
        )}

        {contextSections.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {contextSections.map((section) => (
              <TemplateMetaCard
                key={section.title}
                title={section.title}
                description={section.description}
                value={section.value}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  function renderFlowBlockWorkspace() {
    switch (selectedStoryboardBlockId) {
      case "goal":
        return (
          <div className="space-y-5">
            <CampaignIntentStep
              selectedIntent={selectedIntent}
              selectedAudience={selectedAudience}
              onIntentChange={setSelectedIntent}
              onAudienceChange={setSelectedAudience}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <TemplateMeta
                label="Campaign promise"
                value={
                  customPlaybookSummary ||
                  templatePlan?.campaignDraft.shortDescription ||
                  "Shape the promise this campaign should make to contributors."
                }
              />
              <TemplateMeta
                label="Audience posture"
                value={`${inferredIntentState.intent.label} - ${inferredIntentState.audience.label}`}
              />
            </div>
          </div>
        );
      case "quest_lane":
        return (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Generated quest lane
              </p>
              <p className="mt-2 text-sm leading-7 text-sub">
                Keep, skip or refine the generated quest drafts that should make up the first
                member journey in this campaign.
              </p>
            </div>
            <div className="space-y-3">
              {templatePlan?.questDrafts.map((quest, index) => (
                <TemplateQuestCard
                  key={quest.key}
                  item={{
                    ...quest,
                    draft: {
                      ...quest.draft,
                      ...(questDraftEdits[quest.key] ?? {}),
                    },
                  }}
                  index={index}
                  included={selectedQuestKeys.includes(quest.key)}
                  expanded={expandedQuestKeys.includes(quest.key)}
                  onToggle={() =>
                    setSelectedQuestKeys((current) =>
                      current.includes(quest.key)
                        ? current.filter((key) => key !== quest.key)
                        : [...current, quest.key]
                    )
                  }
                  onToggleExpand={() =>
                    setExpandedQuestKeys((current) =>
                      current.includes(quest.key)
                        ? current.filter((key) => key !== quest.key)
                        : [...current, quest.key]
                    )
                  }
                  onEdit={updateQuestDraftEdit}
                />
              ))}
            </div>
          </div>
        );
      case "reward_outcome":
        return (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Generated reward outcome
              </p>
              <p className="mt-2 text-sm leading-7 text-sub">
                Tighten the payoff layer here so the campaign ends with a clear reason to care.
              </p>
            </div>
            <div className="space-y-3">
              {templatePlan?.rewardDrafts.map((reward) => (
                <TemplateRewardCard
                  key={reward.key}
                  item={{
                    ...reward,
                    draft: {
                      ...reward.draft,
                      ...(rewardDraftEdits[reward.key] ?? {}),
                    },
                  }}
                  included={selectedRewardKeys.includes(reward.key)}
                  expanded={expandedRewardKeys.includes(reward.key)}
                  onToggle={() =>
                    setSelectedRewardKeys((current) =>
                      current.includes(reward.key)
                        ? current.filter((key) => key !== reward.key)
                        : [...current, reward.key]
                    )
                  }
                  onToggleExpand={() =>
                    setExpandedRewardKeys((current) =>
                      current.includes(reward.key)
                        ? current.filter((key) => key !== reward.key)
                        : [...current, reward.key]
                    )
                  }
                  onEdit={updateRewardDraftEdit}
                />
              ))}
            </div>
          </div>
        );
      case "raid_pressure":
        return (
          <div className="space-y-5">
            <div className="rounded-[18px] border border-amber-400/20 bg-amber-500/[0.06] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-300">
                Raid layer
              </p>
              <p className="mt-3 text-sm leading-7 text-amber-100">
                This campaign does not create the raid itself here. Instead, use this block to
                decide whether the campaign needs a pressure wave and whether the launch timing is
                strong enough to support it.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TemplateMeta
                label="Current posture"
                value={
                  selectedTemplate?.id === "social_raid_push"
                    ? "Raid-led launch pressure is expected."
                    : "Raids stay optional until the campaign proves it needs urgency."
                }
              />
              <TemplateMeta
                label="Next move"
                value="Generate the campaign first, then add a dedicated raid if you want live pressure on top of the quest lane."
              />
            </div>
          </div>
        );
      case "launch_posture":
        return (
          <div className="space-y-5">
            <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.018] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Launch watch
              </p>
              <p className="mt-3 text-sm leading-7 text-sub">
                This block keeps the workspace context, mission map and launch posture visible
                before you move into final generation.
              </p>
            </div>
            <BuilderSidebarCard title="Mission map">
              <CampaignMissionMap items={missionMap} />
            </BuilderSidebarCard>
            <BuilderSidebarCard title="Launch preview">
              <CampaignLaunchPreview preview={launchPreview} />
            </BuilderSidebarCard>
          </div>
        );
      default:
        return null;
    }
  }

  function renderFlowInspectorChildren() {
    if (!selectedStoryboardBlock) return null;

    if (selectedStoryboardBlockId === "quest_lane") {
      return (
        <div className="space-y-3">
          <TemplateMeta
            label="Included quests"
            value={`${includedQuestDrafts.length} of ${templatePlan?.questDrafts.length ?? 0} drafts are active in the first wave.`}
          />
          <TemplateMeta
            label="First member moment"
            value={includedQuestDrafts[0]?.draft.title || "No first-wave quest selected yet."}
          />
        </div>
      );
    }

    if (selectedStoryboardBlockId === "reward_outcome") {
      return (
        <div className="space-y-3">
          <TemplateMeta
            label="Included rewards"
            value={`${includedRewardDrafts.length} of ${templatePlan?.rewardDrafts.length ?? 0} drafts are active in the payoff layer.`}
          />
          <TemplateMeta
            label="Primary payoff"
            value={includedRewardDrafts[0]?.draft.title || "No reward outcome selected yet."}
          />
        </div>
      );
    }

    if (selectedStoryboardBlockId === "launch_posture") {
      return <CampaignLaunchPreview preview={launchPreview} />;
    }

    return (
      <div className="space-y-3">
        <TemplateMeta label="Intent" value={inferredIntentState.intent.label} />
        <TemplateMeta label="Audience" value={inferredIntentState.audience.label} />
      </div>
    );
  }

  function renderStudioCore() {
    if (currentStep === "template") {
      return (
        <div className="space-y-4">
          <BuilderStepHeader
            eyebrow={`Step ${currentStepIndex + 1}`}
            title="Start from a complete playbook"
            description="Pick the campaign system that fits this workspace best. Veltrix scores templates against your project context so teams can move fast without building from scratch."
            stepIndex={currentStepIndex + 1}
            totalSteps={builderSteps.length}
          />

          <CampaignIntentStep
            selectedIntent={selectedIntent}
            selectedAudience={selectedAudience}
            onIntentChange={setSelectedIntent}
            onAudienceChange={setSelectedAudience}
          />

          {savedProjectTemplates.length > 0 ? (
            <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.018] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Saved project templates
              </p>
              <div className="mt-4 space-y-3">
                {savedProjectTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-[16px] border border-white/[0.026] bg-black/20 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-text">{template.name}</p>
                        <p className="mt-2 text-sm leading-6 text-sub">
                          {template.description || "Reusable project-specific template"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => applySavedTemplate(template.configuration)}
                          className="rounded-xl border border-white/10 bg-white/[0.018] px-3 py-2 text-sm font-bold text-text transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
                        >
                          Load variant
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProjectCampaignTemplate(template.id)}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/[0.055] px-3 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-500/15"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {featuredTemplate ? (
              <TemplateOptionCard
                template={featuredTemplate}
                active={featuredTemplate.id === selectedTemplateId}
                featured
                onSelect={() => chooseTemplate(featuredTemplate.id)}
              />
            ) : null}

            {secondaryTemplates.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {secondaryTemplates.map((template) => (
                  <TemplateOptionCard
                    key={template.id}
                    template={template}
                    active={template.id === selectedTemplateId}
                    onSelect={() => chooseTemplate(template.id)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    if (currentStep === "custom") {
      return (
        <div className="space-y-4">
          <BuilderStepHeader
            eyebrow={`Step ${currentStepIndex + 1}`}
            title="Shape your custom playbook"
            description="You are not using a prebuilt template here. Set the custom direction first, then continue into the workspace wiring and launch setup."
            stepIndex={currentStepIndex + 1}
            totalSteps={builderSteps.length}
          />

          <div className="grid gap-4 lg:items-start lg:grid-cols-2">
            <label className="block rounded-[18px] border border-white/[0.026] bg-white/[0.018] p-4">
              <span className="mb-2 block text-sm font-semibold text-text">Campaign title</span>
              <input
                value={campaignTitleDraft}
                onChange={(event) => setCampaignTitleDraft(event.target.value)}
                className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
                placeholder="Chainwars Custom Sprint"
              />
              <p className="mt-3 text-sm leading-6 text-sub">
                This becomes the public campaign title and anchors the rest of the custom setup
                path.
              </p>
            </label>

            <label className="block rounded-[18px] border border-white/[0.026] bg-white/[0.018] p-4">
              <span className="mb-2 block text-sm font-semibold text-text">
                Short campaign hook
              </span>
              <input
                value={customPlaybookSummary}
                onChange={(event) => setCustomPlaybookSummary(event.target.value)}
                className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
                placeholder="A custom campaign for holders, community and launch traffic"
              />
              <p className="mt-3 text-sm leading-6 text-sub">
                Use one sentence to frame what this custom campaign is trying to do.
              </p>
            </label>
          </div>

          <label className="block rounded-[18px] border border-white/[0.026] bg-white/[0.018] p-4">
            <span className="mb-2 block text-sm font-semibold text-text">Internal direction</span>
            <textarea
              value={customPlaybookGoal}
              onChange={(event) => setCustomPlaybookGoal(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
              placeholder="Describe the flow you want to build: what should users do first, what should this campaign unlock, and what kind of reward logic should it support?"
            />
            <p className="mt-3 text-sm leading-6 text-sub">
              This is your own custom playbook note. It helps the launch step feel intentional
              instead of blank.
            </p>
          </label>
        </div>
      );
    }

    if (currentStep === "autofill") {
      return (
        <div className="space-y-4">
          <BuilderStepHeader
            eyebrow={`Step ${currentStepIndex + 1}`}
            title="Patch the workspace before the campaign wires itself"
            description="Use this stage to close the missing context gaps once, then move into the generated launch architecture."
            stepIndex={currentStepIndex + 1}
            totalSteps={builderSteps.length}
          />
          {renderWorkspaceContextEditor()}
        </div>
      );
    }

    if (currentStep === "flow") {
      return (
        <div className="space-y-4">
          <BuilderStepHeader
            eyebrow={`Step ${currentStepIndex + 1}`}
            title="Tune the campaign storyboard"
            description="This is the core architecture pass. Select a block in the storyboard, then refine the exact part of the campaign journey that block owns."
            stepIndex={currentStepIndex + 1}
            totalSteps={builderSteps.length}
          />

          <CampaignStoryboardCanvas
            blocks={storyboardBlocks}
            selectedBlockId={selectedStoryboardBlockId}
            onSelect={setSelectedStoryboardBlockId}
          />

          <div className="grid gap-4 xl:items-start xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>{renderFlowBlockWorkspace()}</div>
            <CampaignStoryboardInspector block={selectedStoryboardBlock}>
              {renderFlowInspectorChildren()}
            </CampaignStoryboardInspector>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <BuilderStepHeader
          eyebrow="Campaign Studio Launch"
          title="Lock the launch posture and generate the campaign"
          description="Keep the storyboard in view, focus one block at a time, and generate the campaign once the final posture feels right."
          stepIndex={currentStepIndex + 1}
          totalSteps={builderSteps.length}
        />

        <CampaignStoryboardCanvas
          blocks={storyboardBlocks}
          selectedBlockId={selectedStoryboardBlockId}
          onSelect={setSelectedStoryboardBlockId}
        />

        <div className="grid gap-4 xl:items-start xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.018] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Save this variant
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-text">Template name</span>
                  <input
                    value={savedTemplateName}
                    onChange={(event) => setSavedTemplateName(event.target.value)}
                    className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
                    placeholder="Chainwars launch variant"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-text">Short note</span>
                  <input
                    value={savedTemplateDescription}
                    onChange={(event) => setSavedTemplateDescription(event.target.value)}
                    className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
                    placeholder="For launch pushes with quote-post proof"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={saveCurrentTemplateVariant}
                  disabled={!selectedProject || !selectedTemplate || savingTemplate}
                  className="rounded-2xl border border-white/10 bg-white/[0.018] px-4 py-3 font-bold text-text transition hover:-translate-y-0.5 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingTemplate ? "Saving variant..." : "Save as project variant"}
                </button>
                {savedTemplateMessage ? <p className="text-sm text-sub">{savedTemplateMessage}</p> : null}
              </div>
            </div>

            {generationMessage ? (
              <div className="rounded-[16px] border border-primary/25 bg-primary/[0.055] px-4 py-4 text-sm text-primary">
                {generationMessage}
              </div>
            ) : null}

            <CampaignForm
              projects={projects}
              defaultProjectId={selectedProject?.id}
              resetKey={`${selectedProject?.id || "none"}:${selectedTemplateId}`}
              studioLayout="storyboard"
              focusBlockId={selectedStoryboardBlockId}
              entrySourceLabel={entrySourceLabel}
              initialValues={
                templatePlan
                  ? {
                      ...templatePlan.campaignDraft,
                      title: campaignTitleDraft || templatePlan.campaignDraft.title,
                      shortDescription:
                        customPlaybookSummary || templatePlan.campaignDraft.shortDescription,
                      longDescription:
                        customPlaybookGoal || templatePlan.campaignDraft.longDescription,
                      slug: (campaignTitleDraft || templatePlan.campaignDraft.title)
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .replace(/\s+/g, "-")
                        .replace(/-+/g, "-"),
                    }
                  : undefined
              }
              onSubmit={async (values) => {
                setIsGenerating(true);
                setGenerationMessage("Generating campaign and drafting linked quests and rewards...");

                try {
                  const campaignId = await createCampaign(values);

                  if (templatePlan) {
                    for (const quest of includedQuestDrafts) {
                      await createQuest({
                        ...quest.draft,
                        projectId: values.projectId,
                        campaignId,
                        startsAt: values.startsAt || quest.draft.startsAt,
                        endsAt: values.endsAt || quest.draft.endsAt,
                        status: values.status === "active" ? "active" : quest.draft.status,
                      });
                    }

                    for (const reward of includedRewardDrafts) {
                      await createReward({
                        ...reward.draft,
                        projectId: values.projectId,
                        campaignId,
                        status: values.status === "active" ? "active" : reward.draft.status,
                      });
                    }
                  }

                  setGenerationMessage("Campaign generated successfully. Review the next step below.");
                  setGeneratedCampaign({
                    id: campaignId,
                    title: values.title,
                  });
                } catch (error: any) {
                  setGenerationMessage(error?.message || "Failed to generate the campaign.");
                  throw error;
                } finally {
                  setIsGenerating(false);
                }
              }}
              submitLabel={isGenerating ? "Generating Campaign..." : "Generate Campaign"}
            />
          </div>

          <CampaignStoryboardInspector block={selectedStoryboardBlock}>
            <CampaignLaunchPreview preview={launchPreview} />
          </CampaignStoryboardInspector>
        </div>
      </div>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-4">
        <StudioEntryCommandDeck
          studio="Campaign Studio"
          title="Create a campaign from one guided mission lane"
          description="Project, template and source context stay visible here, while the storyboard below focuses the team on the next campaign decision."
          projectName={selectedProject?.name}
          entrySourceLabel={entrySourceLabel}
          returnHref={returnHref}
          metrics={[
            { label: "Project", value: selectedProject?.name || "Choose" },
            { label: "Template", value: selectedTemplate?.label || "Choose" },
            { label: "Source", value: entrySourceLabel || "Direct" },
          ]}
          builderAnchor="campaign-studio-builder"
        />

        <div id="campaign-studio-builder">
          <StudioShell
          eyebrow="Campaign Studio"
          title="Design the mission lane before you launch it"
          description="Move from project intent into a clean storyboard. Pick the block you want to shape, keep the member-facing preview visible, and only see the controls that matter for the current campaign decision."
          progressPercent={progressPercent}
          metrics={null}
          contextPills={null}
          steps={builderSteps.map((step) => ({
            id: step.id,
            eyebrow: "Step",
            label: step.label,
            description: step.description,
            complete: visitedSteps.includes(step.id),
          }))}
          currentStep={currentStep}
          onSelectStep={attemptStepNavigation}
          topFrame={
            <StudioTopFrame
              eyebrow="Campaign Studio"
              title="Design the mission lane before you launch it"
              description="Start from project intent, patch the workspace only where it matters, then move into a storyboard that keeps goals, quests, rewards and launch posture aligned."
              actions={
                <StudioModeToggle
                  label="Studio lens"
                  value={studioLens}
                  onChange={setStudioLens}
                  options={[
                    {
                      value: "strategy",
                      label: "Strategy",
                      eyebrow: "Intent, audience, flow",
                    },
                    {
                      value: "launch",
                      label: "Launch",
                      eyebrow: "Readiness, output, next move",
                    },
                  ]}
                />
              }
              context={
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/[0.026] bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-text">
                    {selectedProject?.name || "No workspace"}
                  </span>
                  <span className="rounded-full border border-white/[0.026] bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub">
                    {selectedTemplate?.label || "Playbook not selected"}
                  </span>
                  <span className="rounded-full border border-white/[0.026] bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub">
                    {includedQuestDrafts.length} quests
                  </span>
                  <span className="rounded-full border border-white/[0.026] bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub">
                    {includedRewardDrafts.length} rewards
                  </span>
                </div>
              }
              supporting={
                <div className="grid gap-3 md:grid-cols-3">
                  <BuilderMetricCard label="Workspace" value={selectedProject?.name || "No project"} />
                  <BuilderMetricCard
                    label="Template fit"
                    value={
                      selectedTemplate
                        ? `${selectedTemplate.fitLabel} (${selectedTemplate.fitScore}/100)`
                        : "Not selected"
                    }
                  />
                  <BuilderMetricCard
                    label="Missing context"
                    value={String(currentMissingContextFields.length)}
                  />
                </div>
              }
            />
          }
          leftRail={
            <StudioStepRail
              steps={storyboardStepItems}
              currentStep={currentStep}
              onSelect={attemptStepNavigation}
            />
          }
          rightRail={
            <>
              <StudioPreviewCard
                eyebrow={studioLens === "strategy" ? "Member view" : "Launch readout"}
                title={
                  currentStep === "launch"
                    ? "Launch snapshot"
                    : currentStep === "flow"
                      ? "Storyboard preview"
                      : "Campaign preview"
                }
                description="Keep the public campaign shape in view while you tune the underlying system."
              >
                {selectedTemplate && templatePlan ? (
                  <div className="space-y-5">
                    <CampaignPreviewSurface
                      templateLabel={
                        selectedTemplate.id === "blank_campaign_canvas"
                          ? "Custom Playbook"
                          : selectedTemplate.label
                      }
                      title={
                        campaignTitleDraft ||
                        customPlaybookSummary ||
                        templatePlan.campaignDraft.title
                      }
                      summary={customPlaybookSummary || templatePlan.campaignDraft.shortDescription}
                      fitLabel={selectedTemplate.fitLabel}
                      fitScore={selectedTemplate.fitScore}
                      questCount={`${includedQuestDrafts.length}/${templatePlan.questDrafts.length}`}
                      rewardCount={`${includedRewardDrafts.length}/${templatePlan.rewardDrafts.length}`}
                      missingContext={currentMissingContextFields.length}
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      <PreviewStat
                        label="Edited drafts"
                        value={editedQuestCount + editedRewardCount}
                      />
                      <PreviewStat
                        label="Audience"
                        value={selectedAudience.replace(/_/g, " ")}
                      />
                    </div>

                    {studioLens === "launch" || currentStep === "launch" ? (
                      <CampaignLaunchPreview preview={launchPreview} />
                    ) : (
                      <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.018] p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                          Mission map
                        </p>
                        <div className="mt-4">
                          <CampaignMissionMap items={missionMap} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-sub">
                    Pick a playbook to unlock the storyboard, preview and launch posture.
                  </p>
                )}
              </StudioPreviewCard>

              <StudioWarningRail
                title="Launch watchlist"
                items={
                  stepError
                    ? [
                        {
                          label: "Current blocker",
                          description: stepError,
                          tone: "warning" as const,
                        },
                        ...storyboardWarnings,
                      ]
                    : storyboardWarnings
                }
              />
            </>
          }
          canvasClassName="space-y-4"
        >
          {renderStudioCore()}
          </StudioShell>
        </div>

        {generatedCampaign ? (
          <SuccessCampaignModal
            campaign={generatedCampaign}
            onClose={() => setGeneratedCampaign(null)}
            onOpenOverview={() => {
              setGeneratedCampaign(null);
              router.push("/campaigns");
            }}
            onOpenCampaign={() => {
              setGeneratedCampaign(null);
              router.push(`/campaigns/${generatedCampaign.id}`);
            }}
          />
        ) : null}

        <BuilderBottomNav
          canGoBack={Boolean(previousStep)}
          onBack={() => previousStep && setCurrentStep(previousStep.id)}
          nextLabel={nextStep ? `Continue to ${nextStep.label}` : undefined}
          onNext={
            nextStep
              ? () => {
                  const error = validateCurrentStep(currentStep);
                  if (error) {
                    setStepError(error);
                    return;
                  }
                  attemptStepNavigation(nextStep.id);
                }
              : undefined
          }
          footerLabel={`Step ${currentStepIndex + 1} - ${currentStepMeta.label}`}
        />
      </div>
    </AdminShell>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={null}>
      <NewCampaignPageContent />
    </Suspense>
  );
}

function SuccessCampaignModal({
  campaign,
  onClose,
  onOpenOverview,
  onOpenCampaign,
}: {
  campaign: {
    id: string;
    title: string;
  };
  onClose: () => void;
  onOpenOverview: () => void;
  onOpenCampaign: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-[20px] border border-primary/20 bg-[linear-gradient(180deg,rgba(16,20,28,0.98),rgba(8,10,16,0.98))] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.38)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Campaign Generated
            </p>
            <h3 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-text">
              Your campaign is ready to go
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-sub">
              <span className="font-semibold text-text">{campaign.title}</span> has
              been generated successfully. You can check its status in the campaign
              overview or jump straight into the campaign workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.018] px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-sub transition hover:bg-white/[0.08] hover:text-text"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <PreviewStat label="Campaign title" value={campaign.title} />
          <PreviewStat label="Status route" value="Check in overview" />
          <PreviewStat label="Next move" value="Review and publish" />
        </div>

        <div className="mt-6 rounded-[18px] border border-white/[0.026] bg-white/[0.018] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Next step
          </p>
          <p className="mt-3 text-sm leading-7 text-sub">
            Open the campaign overview to confirm status, continue editing drafts,
            or jump directly into the generated campaign if you want to inspect the
            linked quest and reward flow right away.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onOpenCampaign}
            className="rounded-2xl border border-white/10 bg-white/[0.018] px-5 py-3 font-bold text-text transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
          >
            Open Campaign
          </button>
          <button
            type="button"
            onClick={onOpenOverview}
            className="rounded-2xl bg-primary px-5 py-3 font-bold text-black transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Check Status In Overview
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateOptionCard({
  template,
  active,
  featured = false,
  onSelect,
}: {
  template: CampaignTemplateOption;
  active: boolean;
  featured?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-[20px] border text-left transition ${
        featured ? "p-6" : "p-4"
      } ${
        active
          ? "border-primary/40 bg-[linear-gradient(135deg,rgba(199,255,0,0.12),rgba(255,255,255,0.04))] shadow-[0_18px_36px_rgba(0,0,0,0.24)]"
          : "border-white/[0.026] bg-white/[0.018] hover:border-white/[0.045] hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className={featured ? "max-w-2xl" : "min-w-0"}>
          <div className="flex flex-wrap items-center gap-2">
            {featured ? (
              <span className="rounded-full bg-primary/[0.075] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                Featured fit
              </span>
            ) : null}
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                template.fitLabel === "Best fit"
                  ? "bg-primary/20 text-primary"
                  : template.fitLabel === "Strong fit"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : template.fitLabel === "Good fit"
                      ? "bg-white/5 text-text"
                      : "bg-amber-500/[0.075] text-amber-300"
              }`}
            >
              {template.fitLabel}
            </span>
          </div>
          <p className={`mt-3 font-bold text-text ${featured ? "text-[1.02rem]" : "text-sm"}`}>
            {template.label}
          </p>
          <p className="mt-2 text-sm leading-6 text-sub">{template.summary}</p>
          {template.fitReasons[0] ? (
            <p className="mt-4 text-sm leading-6 text-sub">
              <span className="font-semibold text-text">Why it fits:</span>{" "}
              {template.fitReasons[0]}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
            {template.fitScore}/100
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
            {template.quests.length}Q / {template.rewards.length}R
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
              active ? "bg-primary/[0.075] text-primary" : "bg-black/20 text-sub"
            }`}
          >
            {active ? "Selected" : "Choose"}
          </span>
        </div>
      </div>
    </button>
  );
}

function CampaignPreviewSurface({
  templateLabel,
  title,
  summary,
  fitLabel,
  fitScore,
  questCount,
  rewardCount,
  missingContext,
}: {
  templateLabel: string;
  title: string;
  summary: string;
  fitLabel: string;
  fitScore: number;
  questCount: string;
  rewardCount: string;
  missingContext: number;
}) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(199,255,0,0.14),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
      <div className="rounded-[18px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(6,8,12,0.82))] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {templateLabel}
            </p>
            <h3 className="mt-3 text-[1.45rem] font-extrabold tracking-[-0.03em] text-text">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-sub">{summary}</p>
          </div>
          <div className="rounded-[20px] border border-white/[0.026] bg-black/20 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
              Template fit
            </p>
            <p className="mt-2 text-lg font-extrabold text-text">
              {fitLabel} <span className="text-sub">({fitScore}/100)</span>
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[16px] border border-white/[0.026] bg-black/20 px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
              Member moment
            </p>
            <p className="mt-2 text-base font-semibold text-text">
              Contributors enter a guided launch lane with quests, rewards and a clear reason to act now.
            </p>
          </div>
          <div className="rounded-[16px] border border-white/[0.026] bg-black/20 px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
              Context pressure
            </p>
            <p className="mt-2 text-base font-semibold text-text">
              {missingContext === 0 ? "Fully routed" : `${missingContext} gaps to patch`}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <PreviewStat label="Quest flow" value={questCount} />
          <PreviewStat label="Reward flow" value={rewardCount} />
          <PreviewStat label="Missing context" value={missingContext} />
        </div>
      </div>
    </div>
  );
}

function PreviewStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.018] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05]">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
        {label}
      </p>
      <p className="mt-2 text-lg font-extrabold text-text">{value}</p>
    </div>
  );
}

function CampaignStepNavigator({
  steps,
  currentStep,
  currentStepIndex,
  visitedSteps,
  onSelect,
}: {
  steps: Array<{
    id: BuilderStepId;
    label: string;
    description: string;
  }>;
  currentStep: BuilderStepId;
  currentStepIndex: number;
  visitedSteps: BuilderStepId[];
  onSelect: (step: BuilderStepId) => void;
}) {
  return (
    <div className="rounded-[16px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(15,19,28,0.94),rgba(10,12,18,0.92))] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
      <div className="grid gap-3 xl:grid-cols-4">
        {steps.map((step, index) => {
          const active = step.id === currentStep;
          const complete = index < currentStepIndex && visitedSteps.includes(step.id);

          return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelect(step.id)}
              className={`rounded-[16px] border px-4 py-4 text-left transition ${
                active
                  ? "border-primary/35 bg-[linear-gradient(135deg,rgba(199,255,0,0.12),rgba(255,255,255,0.04))]"
                  : "border-white/[0.026] bg-white/[0.018] hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sub">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-bold tracking-[-0.01em] text-text">
                    {step.label}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                    complete
                      ? "bg-primary/[0.075] text-primary"
                    : active
                        ? "bg-white/[0.08] text-text"
                        : "bg-black/20 text-sub"
                  }`}
                >
                  {complete ? "Locked in" : active ? "Current" : "Next"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-sub">{step.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TemplateQuestCard({
  item,
  index,
  included,
  expanded,
  onToggle,
  onToggleExpand,
  onEdit,
}: {
  item: ResolvedQuestDraft;
  index: number;
  included: boolean;
  expanded: boolean;
  onToggle: () => void;
  onToggleExpand: () => void;
  onEdit: (
    key: string,
    field: keyof EditableQuestDraft,
    value: string | number
  ) => void;
}) {
  return (
    <div className="rounded-[18px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-text">
            {index + 1}. {item.draft.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-sub">
            {item.draft.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggleExpand}
            className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text"
          >
            {expanded ? "Collapse" : "Edit"}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
              included
                ? "bg-primary/[0.075] text-primary"
                : "bg-white/5 text-sub"
            }`}
          >
            {included ? "Included" : "Skipped"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
        <span className="rounded-full bg-primary/[0.075] px-3 py-1 text-primary">
          {item.draft.questType}
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-text">
          {item.draft.xp} xp
        </span>
        <span
          className={`rounded-full px-3 py-1 ${
            item.missingProjectFields.length > 0
              ? "bg-amber-500/[0.075] text-amber-300"
              : "bg-emerald-500/15 text-emerald-300"
          }`}
        >
          {item.missingProjectFields.length > 0 ? "Needs context" : "Ready"}
        </span>
      </div>

      {expanded ? (
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Quest title
          </span>
          <input
            value={item.draft.title}
            onChange={(event) => onEdit(item.key, "title", event.target.value)}
            className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            XP
          </span>
          <input
            type="number"
            min={0}
            value={item.draft.xp}
            onChange={(event) =>
              onEdit(item.key, "xp", Number(event.target.value || 0))
            }
            className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Description
          </span>
          <textarea
            value={item.draft.description}
            onChange={(event) =>
              onEdit(item.key, "description", event.target.value)
            }
            rows={3}
            className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Action label
          </span>
          <input
            value={item.draft.actionLabel}
            onChange={(event) =>
              onEdit(item.key, "actionLabel", event.target.value)
            }
            className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Action URL
          </span>
          <input
            value={item.draft.actionUrl ?? ""}
            onChange={(event) =>
              onEdit(item.key, "actionUrl", event.target.value)
            }
            className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
            placeholder="https://..."
          />
        </label>
      </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-white/[0.026] bg-black/20 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Quick read
          </p>
          <p className="mt-2 text-sm leading-6 text-text">
            {item.missingProjectFields.length > 0
              ? `Needs ${item.missingProjectFields
                  .map((field) => formatProjectFieldLabel(field))
                  .join(", ")} before it is fully ready.`
              : "Ready to generate with the current campaign setup."}
          </p>
        </div>
      )}
    </div>
  );
}

function TemplateRewardCard({
  item,
  included,
  expanded,
  onToggle,
  onToggleExpand,
  onEdit,
}: {
  item: ResolvedRewardDraft;
  included: boolean;
  expanded: boolean;
  onToggle: () => void;
  onToggleExpand: () => void;
  onEdit: (
    key: string,
    field: keyof EditableRewardDraft,
    value: string | number
  ) => void;
}) {
  return (
    <div className="rounded-[18px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-text">{item.draft.title}</p>
          <p className="mt-2 text-sm leading-6 text-sub">
            {item.draft.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggleExpand}
            className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text"
          >
            {expanded ? "Collapse" : "Edit"}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
              included
                ? "bg-primary/[0.075] text-primary"
                : "bg-white/5 text-sub"
            }`}
          >
            {included ? "Included" : "Skipped"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
        <span className="rounded-full bg-white/5 px-3 py-1 text-text">
          {item.draft.rewardType}
        </span>
        <span className="rounded-full bg-primary/[0.075] px-3 py-1 text-primary">
          {item.draft.cost} xp
        </span>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">
          Ready
        </span>
      </div>

      {expanded ? (
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Reward title
          </span>
          <input
            value={item.draft.title}
            onChange={(event) => onEdit(item.key, "title", event.target.value)}
            className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Cost
          </span>
          <input
            type="number"
            min={0}
            value={item.draft.cost}
            onChange={(event) =>
              onEdit(item.key, "cost", Number(event.target.value || 0))
            }
            className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Description
          </span>
          <textarea
            value={item.draft.description}
            onChange={(event) =>
              onEdit(item.key, "description", event.target.value)
            }
            rows={3}
            className="w-full rounded-2xl border border-white/[0.026] bg-black/20 px-4 py-3 outline-none"
          />
        </label>
      </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-white/[0.026] bg-black/20 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Quick read
          </p>
          <p className="mt-2 text-sm leading-6 text-text">
            This reward will ship as a {item.draft.rarity} {item.draft.rewardType} reward
            worth {item.draft.cost} XP.
          </p>
        </div>
      )}
    </div>
  );
}

function TemplateMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.026] bg-black/20 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-text">{value}</p>
    </div>
  );
}

function TemplateMetaCard({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.018] px-4 py-4">
      <p className="text-sm font-bold text-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{description}</p>
      <p className="mt-3 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
