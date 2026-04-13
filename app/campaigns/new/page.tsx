"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BuilderBottomNav,
  BuilderHero,
  BuilderMetricCard,
  BuilderSidebarCard,
  BuilderStepHeader,
} from "@/components/layout/builder/BuilderPrimitives";
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

type BuilderStepId = "template" | "autofill" | "flow" | "launch";

const builderSteps: Array<{
  id: BuilderStepId;
  eyebrow: string;
  label: string;
  description: string;
}> = [
  {
    id: "template",
    eyebrow: "Step 1",
    label: "Pick a playbook",
    description: "Choose the full campaign template or a saved project variant that fits this workspace best.",
  },
  {
    id: "autofill",
    eyebrow: "Step 2",
    label: "Wire project context",
    description: "See what Veltrix can autofill already and patch the missing project context inline.",
  },
  {
    id: "flow",
    eyebrow: "Step 3",
    label: "Tune generated flow",
    description: "Review the generated quests and rewards, then include, skip, or refine the drafts.",
  },
  {
    id: "launch",
    eyebrow: "Step 4",
    label: "Review and launch",
    description: "Save this setup as a reusable template variant and generate the campaign when it feels right.",
  },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
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

  const [selectedTemplateId, setSelectedTemplateId] =
    useState<CampaignTemplateId>("community_growth_starter");
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

  const selectedProject = useMemo(
    () =>
      projects.find((project) => project.id === activeProjectId) ??
      projects[0] ??
      null,
    [activeProjectId, projects]
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
      effectiveProject
        ? buildCampaignTemplate(effectiveProject, selectedTemplateId)
        : null,
    [effectiveProject, selectedTemplateId]
  );
  const persistedTemplatePlan = useMemo(
    () =>
      selectedProject
        ? buildCampaignTemplate(selectedProject, selectedTemplateId)
        : null,
    [selectedProject, selectedTemplateId]
  );

  const selectedTemplate = templateOptions.find(
    (template) => template.id === selectedTemplateId
  );
  const currentStepIndex = builderSteps.findIndex((step) => step.id === currentStep);
  const currentStepMeta = builderSteps[currentStepIndex];
  const previousStep = builderSteps[currentStepIndex - 1];
  const nextStep = builderSteps[currentStepIndex + 1];
  const progressPercent = Math.round(((currentStepIndex + 1) / builderSteps.length) * 100);

  useEffect(() => {
    setVisitedSteps((current) =>
      current.includes(currentStep) ? current : [...current, currentStep]
    );
    setStepError(null);
  }, [currentStep]);

  useEffect(() => {
    setProjectContextDraft({});
    setQuestDraftEdits({});
    setRewardDraftEdits({});
    setContextMessage(null);
    setSavedTemplateMessage(null);
  }, [selectedProject?.id, selectedTemplateId]);

  useEffect(() => {
    setCampaignTitleDraft(templatePlan?.campaignDraft.title ?? "");
  }, [templatePlan?.campaignDraft.title]);

  useEffect(() => {
    setSelectedQuestKeys(templatePlan?.questDrafts.map((quest) => quest.key) ?? []);
    setSelectedRewardKeys(templatePlan?.rewardDrafts.map((reward) => reward.key) ?? []);
  }, [templatePlan]);

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
  const editableContextFields = useMemo(() => {
    const persistedMissing = persistedTemplatePlan?.missingProjectFields ?? [];
    const draftKeys = Object.keys(projectContextDraft).filter(
      (key) => key in projectContextDraft
    ) as EditableProjectContextField[];

    return Array.from(
      new Set<EditableProjectContextField>([
        ...(persistedMissing as EditableProjectContextField[]),
        ...draftKeys,
      ])
    );
  }, [persistedTemplatePlan?.missingProjectFields, projectContextDraft]);

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
    if (!selectedProject || !templatePlan || templatePlan.missingProjectFields.length === 0) {
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

  function validateCurrentStep(step: BuilderStepId) {
    if (step === "template" && !selectedTemplate) {
      return "Choose a playbook or blank campaign canvas before continuing.";
    }

    if (step === "autofill" && persistedTemplatePlan && persistedTemplatePlan.missingProjectFields.length > 0) {
      return `Add the missing workspace context first: ${persistedTemplatePlan.missingProjectFields
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

  return (
    <AdminShell>
      <div className="space-y-6">
        <BuilderHero
          eyebrow="Campaign Builder Wizard"
          title="New Campaign"
          description="Pick a complete playbook, let Veltrix wire in the workspace context you already captured, and launch a campaign with generated quest and reward drafts."
          progressPercent={progressPercent}
          metrics={
            <>
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
                value={String(persistedTemplatePlan?.missingProjectFields.length ?? 0)}
              />
            </>
          }
        />

        <CampaignStepNavigator
          steps={builderSteps}
          currentStep={currentStep}
          currentStepIndex={currentStepIndex}
          visitedSteps={visitedSteps}
          onSelect={attemptStepNavigation}
        />

        {currentStep !== "launch" ? (
        <div className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
          {currentStep === "template" ? (
          <div className="space-y-6 rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,19,28,0.98),rgba(10,12,18,0.96))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <BuilderStepHeader
              eyebrow="Template Studio"
              title="Start from a complete playbook"
              description="Pick the campaign system that fits this workspace best. Veltrix scores templates against your project context so teams can move fast without building from scratch."
              stepIndex={currentStepIndex + 1}
              totalSteps={builderSteps.length}
            />

            <div className="mt-5 grid gap-3">
              {savedProjectTemplates.length > 0 ? (
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Saved Project Templates
                  </p>
                  <div className="mt-4 space-y-3">
                    {savedProjectTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-text">
                              {template.name}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-sub">
                              {template.description || "Reusable project-specific template"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => applySavedTemplate(template.configuration)}
                              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-bold text-text transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
                            >
                              Load variant
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProjectCampaignTemplate(template.id)}
                              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-500/15"
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

              {templateOptions.map((template) => {
                const isActive = template.id === selectedTemplateId;

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`rounded-[26px] border p-5 text-left transition ${
                      isActive
                        ? "border-primary/40 bg-[linear-gradient(135deg,rgba(199,255,0,0.12),rgba(255,255,255,0.04))] shadow-[0_18px_36px_rgba(0,0,0,0.24)]"
                        : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-text">
                          {template.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-sub">
                          {template.summary}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                            template.fitLabel === "Best fit"
                              ? "bg-primary/20 text-primary"
                              : template.fitLabel === "Strong fit"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : template.fitLabel === "Good fit"
                              ? "bg-white/5 text-text"
                              : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {template.fitLabel}
                        </span>
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
                          {template.fitScore}/100 fit
                        </span>
                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
                          {template.quests.length} quests / {template.rewards.length} rewards
                        </span>
                      </div>
                    </div>

                    {template.fitReasons.length > 0 ? (
                      <div className="mt-4 rounded-[20px] border border-white/8 bg-black/20 px-4 py-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                          Why this fit
                        </p>
                        <div className="mt-2 space-y-2">
                          {template.fitReasons.map((reason) => (
                            <p key={reason} className="text-sm leading-6 text-sub">
                              {reason}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
          ) : null}

          <div className="space-y-5 xl:self-start">
            {selectedTemplate && templatePlan ? (
              <div className="space-y-5">
                <BuilderSidebarCard
                  title={
                    currentStep === "autofill"
                      ? "Autofill Preview"
                      : currentStep === "flow"
                        ? "Generated Flow"
                        : "Campaign Preview"
                  }
                >
                  <div className="space-y-5">
                    {currentStep !== "flow" ? (
                    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-sm font-bold text-text">
                        {selectedTemplate.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-sub">
                        {selectedTemplate.goal}
                      </p>
                    </div>
                    ) : null}

                    {contextSections.length > 0 && currentStep === "autofill" ? (
                      <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                          Context Signals
                        </p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {contextSections.map((section) => (
                            <TemplateMetaCard
                              key={section.title}
                              title={section.title}
                              description={section.description}
                              value={section.value}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-3 md:grid-cols-2">
                      <PreviewStat
                        label="Selected quests"
                        value={`${includedQuestDrafts.length}/${templatePlan.questDrafts.length}`}
                      />
                      <PreviewStat
                        label="Template fit"
                        value={`${selectedTemplate.fitLabel} (${selectedTemplate.fitScore}/100)`}
                      />
                      <PreviewStat
                        label="Reward drafts"
                        value={`${includedRewardDrafts.length}/${templatePlan.rewardDrafts.length}`}
                      />
                      <PreviewStat
                        label="Campaign mode"
                        value={selectedTemplate.id === "blank_campaign_canvas" ? "Custom start" : "Playbook"}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <PreviewStat
                        label="Campaign title"
                        value={campaignTitleDraft || templatePlan.campaignDraft.title}
                      />
                      <PreviewStat
                        label="Edited drafts"
                        value={editedQuestCount + editedRewardCount}
                      />
                      <PreviewStat
                        label="Missing context"
                        value={persistedTemplatePlan?.missingProjectFields.length ?? 0}
                      />
                      <PreviewStat
                        label="Launch route"
                        value={currentStep === "flow" ? "Tune before generate" : "Review before generate"}
                      />
                    </div>

                    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-primary">
                          Campaign title
                        </span>
                        <input
                          value={campaignTitleDraft}
                          onChange={(event) => setCampaignTitleDraft(event.target.value)}
                          className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none"
                          placeholder="Give this campaign its public title"
                        />
                      </label>
                    </div>
                  </div>
                </BuilderSidebarCard>

                {currentStep !== "flow" ? (
                <BuilderSidebarCard title="Generation Route">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Generation route
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <TemplateMeta
                      label="Campaign output"
                      value="Editable before save via the builder form below."
                    />
                    <TemplateMeta
                      label="Quest output"
                      value="Selected quests generate as drafts by default, or go active if the campaign is saved as active."
                    />
                    <TemplateMeta
                      label="Reward output"
                      value="Selected rewards follow the same route, so launch-ready campaigns can publish in one pass."
                    />
                  </div>
                </BuilderSidebarCard>
                ) : null}

                {currentStep === "autofill" ? (
                <BuilderSidebarCard title="Project Context Usage">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Project context usage
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTemplate.requiredProjectFields.map((field) => (
                      <span
                        key={field}
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                          (persistedTemplatePlan?.missingProjectFields ?? []).includes(field)
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        {formatProjectFieldLabel(field)}
                      </span>
                    ))}
                  </div>
                  {(persistedTemplatePlan?.missingProjectFields.length ?? 0) > 0 ? (
                    <div className="mt-4 space-y-4">
                      <p className="text-sm leading-6 text-amber-200">
                        Missing project fields:{" "}
                        {(persistedTemplatePlan?.missingProjectFields ?? [])
                          .map((field) => formatProjectFieldLabel(field))
                          .join(", ")}
                        . Fill them here once and this template will auto-wire itself.
                      </p>

                      <div className="grid gap-4 md:grid-cols-2">
                        {editableContextFields.map((field) => (
                          <label key={field} className="block">
                            <span className="mb-2 block text-sm font-semibold text-text">
                              {formatProjectFieldLabel(field)}
                            </span>
                            <input
                              value={
                                projectContextDraft[field as EditableProjectContextField] ??
                                ((selectedProject?.[
                                  field as EditableProjectContextField
                                ] as string | undefined) ?? "")
                              }
                              onChange={(event) =>
                                setProjectContextDraft((current) => ({
                                  ...current,
                                  [field as EditableProjectContextField]: event.target.value,
                                }))
                              }
                              className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none"
                              placeholder={`Add ${formatProjectFieldLabel(field)}`}
                            />
                          </label>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={saveProjectContextFields}
                          disabled={contextSaving}
                          className="rounded-2xl bg-primary px-4 py-3 font-bold text-black shadow-[0_12px_28px_rgba(141,255,89,0.18)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {contextSaving ? "Saving workspace context..." : "Save workspace context"}
                        </button>
                        {contextMessage ? (
                          <p className="text-sm text-sub">{contextMessage}</p>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-sub">
                      All required project links are present, so this template can
                      auto-fill immediately.
                    </p>
                  )}
                </BuilderSidebarCard>
                ) : null}

                {currentStep === "flow" ? (
                <BuilderSidebarCard title="Generated Quest Flow">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Generated quest flow
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Turn off anything you do not want, then refine the drafts that should ship with this campaign.
                  </p>
                  <div className="mt-4 space-y-3">
                    {templatePlan.questDrafts.map((quest, index) => (
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
                        onToggle={() =>
                          setSelectedQuestKeys((current) =>
                            current.includes(quest.key)
                              ? current.filter((key) => key !== quest.key)
                              : [...current, quest.key]
                          )
                        }
                        onEdit={updateQuestDraftEdit}
                      />
                    ))}
                  </div>
                </BuilderSidebarCard>
                ) : null}

                {currentStep === "flow" ? (
                <BuilderSidebarCard title="Generated Rewards">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Generated rewards
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Tighten the payoff layer here so the campaign launches with a clean, intentional reward ladder.
                  </p>
                  <div className="mt-4 space-y-3">
                    {templatePlan.rewardDrafts.map((reward) => (
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
                        onToggle={() =>
                          setSelectedRewardKeys((current) =>
                            current.includes(reward.key)
                              ? current.filter((key) => key !== reward.key)
                              : [...current, reward.key]
                          )
                        }
                        onEdit={updateRewardDraftEdit}
                      />
                    ))}
                  </div>
                </BuilderSidebarCard>
                ) : null}
              </div>
            ) : (
              <BuilderSidebarCard title="Campaign Preview">
                <p className="text-sm text-sub">
                  Pick a project workspace and a template to see the generated plan.
                </p>
              </BuilderSidebarCard>
            )}
          </div>
        </div>
        ) : null}

        {currentStep === "launch" ? (
        <div className="space-y-6 rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,19,28,0.98),rgba(10,12,18,0.96))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <BuilderStepHeader
            eyebrow="Launch Studio"
            title="Review the campaign and save the variant"
            description="Lock in the reusable project variant, then generate the campaign with its selected quest and reward drafts."
            stepIndex={currentStepIndex + 1}
            totalSteps={builderSteps.length}
          />
          <div className="mb-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Save this variant
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text">
                  Template name
                </span>
                <input
                  value={savedTemplateName}
                  onChange={(event) => setSavedTemplateName(event.target.value)}
                  className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none"
                  placeholder="Chainwars launch variant"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text">
                  Short note
                </span>
                <input
                  value={savedTemplateDescription}
                  onChange={(event) =>
                    setSavedTemplateDescription(event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none"
                  placeholder="For launch pushes with quote-post proof"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveCurrentTemplateVariant}
                disabled={!selectedProject || !selectedTemplate || savingTemplate}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 font-bold text-text transition hover:-translate-y-0.5 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingTemplate ? "Saving variant..." : "Save as project variant"}
              </button>
              {savedTemplateMessage ? (
                <p className="text-sm text-sub">{savedTemplateMessage}</p>
              ) : null}
            </div>
          </div>

          {generationMessage ? (
            <div className="rounded-[22px] border border-primary/25 bg-primary/10 px-4 py-4 text-sm text-primary">
              {generationMessage}
            </div>
          ) : null}

          <CampaignForm
            projects={projects}
            defaultProjectId={selectedProject?.id}
            resetKey={`${selectedProject?.id || "none"}:${selectedTemplateId}`}
            initialValues={
              templatePlan
                ? {
                    ...templatePlan.campaignDraft,
                    title: campaignTitleDraft || templatePlan.campaignDraft.title,
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

                setGenerationMessage("Campaign created. Opening the campaign workspace...");
                router.push(`/campaigns/${campaignId}`);
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
        ) : null}

        {stepError ? (
          <div className="rounded-[24px] border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
            {stepError}
          </div>
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
          footerLabel={`${currentStepMeta.eyebrow} - ${currentStepMeta.label}`}
        />
      </div>
    </AdminShell>
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
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05]">
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
    eyebrow: string;
    label: string;
    description: string;
  }>;
  currentStep: BuilderStepId;
  currentStepIndex: number;
  visitedSteps: BuilderStepId[];
  onSelect: (step: BuilderStepId) => void;
}) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,19,28,0.94),rgba(10,12,18,0.92))] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      <div className="grid gap-3 xl:grid-cols-4">
        {steps.map((step, index) => {
          const active = step.id === currentStep;
          const complete = index < currentStepIndex && visitedSteps.includes(step.id);

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelect(step.id)}
              className={`rounded-[22px] border px-4 py-4 text-left transition ${
                active
                  ? "border-primary/35 bg-[linear-gradient(135deg,rgba(199,255,0,0.12),rgba(255,255,255,0.04))]"
                  : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sub">
                    {step.eyebrow}
                  </p>
                  <p className="mt-2 text-sm font-bold tracking-[-0.01em] text-text">
                    {step.label}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                    complete
                      ? "bg-primary/15 text-primary"
                      : active
                        ? "bg-white/[0.08] text-text"
                        : "bg-black/20 text-sub"
                  }`}
                >
                  {complete ? "Done" : active ? "Current" : "Next"}
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
  onToggle,
  onEdit,
}: {
  item: ResolvedQuestDraft;
  index: number;
  included: boolean;
  onToggle: () => void;
  onEdit: (
    key: string,
    field: keyof EditableQuestDraft,
    value: string | number
  ) => void;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-text">
            {index + 1}. {item.draft.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-sub">
            {item.draft.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
            included
              ? "bg-primary/15 text-primary"
              : "bg-white/5 text-sub"
          }`}
        >
          {included ? "Included" : "Skipped"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
        <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">
          {item.draft.questType}
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-text">
          {item.draft.xp} xp
        </span>
        <span
          className={`rounded-full px-3 py-1 ${
            item.missingProjectFields.length > 0
              ? "bg-amber-500/15 text-amber-300"
              : "bg-emerald-500/15 text-emerald-300"
          }`}
        >
          {item.missingProjectFields.length > 0 ? "Needs context" : "Ready"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TemplateMeta
          label="Needs input"
          value={
            item.missingProjectFields.length > 0
              ? item.missingProjectFields
                  .map((field) => formatProjectFieldLabel(field))
                  .join(", ")
              : "Nothing missing"
          }
        />
        <TemplateMeta
          label="Editable before generate"
          value="Title, description, XP, action label and action URL"
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Quest title
          </span>
          <input
            value={item.draft.title}
            onChange={(event) => onEdit(item.key, "title", event.target.value)}
            className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none"
            placeholder="https://..."
          />
        </label>
      </div>
    </div>
  );
}

function TemplateRewardCard({
  item,
  included,
  onToggle,
  onEdit,
}: {
  item: ResolvedRewardDraft;
  included: boolean;
  onToggle: () => void;
  onEdit: (
    key: string,
    field: keyof EditableRewardDraft,
    value: string | number
  ) => void;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-text">{item.draft.title}</p>
          <p className="mt-2 text-sm leading-6 text-sub">
            {item.draft.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
            included
              ? "bg-primary/15 text-primary"
              : "bg-white/5 text-sub"
          }`}
        >
          {included ? "Included" : "Skipped"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
        <span className="rounded-full bg-white/5 px-3 py-1 text-text">
          {item.draft.rewardType}
        </span>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">
          {item.draft.cost} xp
        </span>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">
          Ready
        </span>
      </div>

      <div className="mt-3">
        <TemplateMeta
          label="Editable before generate"
          value="Title, description and reward cost"
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Reward title
          </span>
          <input
            value={item.draft.title}
            onChange={(event) => onEdit(item.key, "title", event.target.value)}
            className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none"
          />
        </label>
      </div>
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
    <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4">
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
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="text-sm font-bold text-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{description}</p>
      <p className="mt-3 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
