"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BuilderBottomNav,
  BuilderHero,
  BuilderMetricCard,
  BuilderStepRail,
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

  const selectedTemplate = templateOptions.find(
    (template) => template.id === selectedTemplateId
  );
  const currentStepIndex = builderSteps.findIndex((step) => step.id === currentStep);
  const currentStepMeta = builderSteps[currentStepIndex];
  const previousStep = builderSteps[currentStepIndex - 1];
  const nextStep = builderSteps[currentStepIndex + 1];
  const progressPercent = Math.round(((currentStepIndex + 1) / builderSteps.length) * 100);

  useEffect(() => {
    setProjectContextDraft({});
    setQuestDraftEdits({});
    setRewardDraftEdits({});
    setContextMessage(null);
    setSavedTemplateMessage(null);
  }, [selectedProject?.id, selectedTemplateId]);

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
      setSavedTemplateMessage("Saved project template loaded.");
    } catch {
      setSavedTemplateMessage("This saved template could not be parsed.");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <BuilderHero
          eyebrow="Campaign Builder Wizard"
          title="New Campaign"
          description="Pick a full campaign template and let Veltrix generate the campaign, quest sequence and reward drafts from the project context you already filled in."
          progressPercent={progressPercent}
          metrics={
            <>
              <BuilderMetricCard label="Active project" value={selectedProject?.name || "No project"} />
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
                value={String(templatePlan?.missingProjectFields.length ?? 0)}
              />
            </>
          }
        />

        <BuilderStepRail
          title="Workflow"
          steps={builderSteps.map((step) => ({
            ...step,
            complete:
              step.id === "template"
                ? Boolean(selectedTemplate)
                : step.id === "autofill"
                  ? Boolean(templatePlan && templatePlan.missingProjectFields.length === 0)
                  : step.id === "flow"
                    ? includedQuestDrafts.length + includedRewardDrafts.length > 0
                    : Boolean(templatePlan?.campaignDraft.title),
          }))}
          currentStep={currentStep}
          onSelect={setCurrentStep}
        />

        {currentStep !== "launch" ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          {currentStep === "template" ? (
          <div className="rounded-[28px] border border-line bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Full Campaign Templates
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-text">
                  Start from a complete playbook
                </h2>
              </div>

              <div className="rounded-2xl border border-line bg-card2 px-4 py-3 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  Active Project
                </p>
                <p className="mt-2 text-lg font-extrabold text-text">
                  {selectedProject?.name || "No project"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {savedProjectTemplates.length > 0 ? (
                <div className="rounded-2xl border border-line bg-card2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Saved Project Templates
                  </p>
                  <div className="mt-4 space-y-3">
                    {savedProjectTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="rounded-2xl border border-line bg-card px-4 py-4"
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
                              className="rounded-xl border border-line px-3 py-2 text-sm font-bold text-text"
                            >
                              Load
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProjectCampaignTemplate(template.id)}
                              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-300"
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
                    className={`rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-line bg-card2 hover:border-primary/40"
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
                      <div className="mt-3 rounded-2xl border border-line bg-card px-4 py-3">
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

          <div className="rounded-[28px] border border-line bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {currentStep === "autofill"
                ? "Autofill Preview"
                : currentStep === "flow"
                  ? "Generated Flow"
                  : "Campaign Preview"}
            </p>
            <h2 className="mt-2 text-xl font-extrabold text-text">
              {currentStep === "autofill"
                ? "Wire the project context"
                : currentStep === "flow"
                  ? "Tune what gets generated"
                  : "What Veltrix will generate for you"}
            </h2>

            {selectedTemplate && templatePlan ? (
              <div className="mt-5 space-y-5">
                {currentStep !== "flow" ? (
                <div className="rounded-2xl border border-line bg-card2 p-4">
                  <p className="text-sm font-bold text-text">
                    {selectedTemplate.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    {selectedTemplate.goal}
                  </p>
                </div>
                ) : null}

                {contextSections.length > 0 && currentStep === "autofill" ? (
                  <div className="rounded-2xl border border-line bg-card2 p-4">
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

                <div className="grid gap-3 md:grid-cols-3">
                  <PreviewStat
                    label="Campaign title"
                    value={templatePlan.campaignDraft.title}
                  />
                  <PreviewStat
                    label="Template fit"
                    value={`${selectedTemplate.fitLabel} (${selectedTemplate.fitScore}/100)`}
                  />
                  <PreviewStat
                    label="Quest drafts"
                    value={`${includedQuestDrafts.length}/${templatePlan.questDrafts.length}`}
                  />
                  <PreviewStat
                    label="Reward drafts"
                    value={`${includedRewardDrafts.length}/${templatePlan.rewardDrafts.length}`}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <PreviewStat
                    label="Auto-wired fields"
                    value={
                      templatePlan.questDrafts.reduce(
                        (total, quest) => total + quest.autofilledFields.length,
                        0
                      ) +
                      templatePlan.rewardDrafts.reduce(
                        (total, reward) => total + reward.autofilledFields.length,
                        0
                      )
                    }
                  />
                  <PreviewStat
                    label="Edited quests"
                    value={editedQuestCount}
                  />
                  <PreviewStat
                    label="Edited rewards"
                    value={editedRewardCount}
                  />
                  <PreviewStat
                    label="Missing context"
                    value={templatePlan.missingProjectFields.length}
                  />
                </div>

                {currentStep === "autofill" ? (
                <div className="rounded-2xl border border-line bg-card2 p-4">
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
                </div>
                ) : null}

                {currentStep === "autofill" ? (
                <div className="rounded-2xl border border-line bg-card2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Project context usage
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTemplate.requiredProjectFields.map((field) => (
                      <span
                        key={field}
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                          templatePlan.missingProjectFields.includes(field)
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        {formatProjectFieldLabel(field)}
                      </span>
                    ))}
                  </div>
                  {templatePlan.missingProjectFields.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      <p className="text-sm leading-6 text-amber-200">
                        Missing project fields:{" "}
                        {templatePlan.missingProjectFields
                          .map((field) => formatProjectFieldLabel(field))
                          .join(", ")}
                        . Fill them here once and this template will auto-wire itself.
                      </p>

                      <div className="grid gap-4 md:grid-cols-2">
                        {templatePlan.missingProjectFields.map((field) => (
                          <label key={field} className="block">
                            <span className="mb-2 block text-sm font-semibold text-text">
                              {formatProjectFieldLabel(field)}
                            </span>
                            <input
                              value={
                                projectContextDraft[field as EditableProjectContextField] ??
                                ((effectiveProject?.[
                                  field as EditableProjectContextField
                                ] as string | undefined) ?? "")
                              }
                              onChange={(event) =>
                                setProjectContextDraft((current) => ({
                                  ...current,
                                  [field as EditableProjectContextField]: event.target.value,
                                }))
                              }
                              className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none"
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
                          className="rounded-2xl bg-primary px-4 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {contextSaving ? "Saving project context..." : "Save project context"}
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
                </div>
                ) : null}

                {currentStep === "flow" ? (
                <div className="rounded-2xl border border-line bg-card2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Generated quest flow
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
                </div>
                ) : null}

                {currentStep === "flow" ? (
                <div className="rounded-2xl border border-line bg-card2 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Generated rewards
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
                </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-sub">
                Pick a project workspace and a template to see the generated plan.
              </p>
            )}
          </div>
        </div>
        ) : null}

        {currentStep === "launch" ? (
        <div className="rounded-[28px] border border-line bg-card p-6">
          <div className="mb-6 rounded-2xl border border-line bg-card2 p-4">
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
                  className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none"
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
                  className="w-full rounded-2xl border border-line bg-card px-4 py-3 outline-none"
                  placeholder="For launch pushes with quote-post proof"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveCurrentTemplateVariant}
                disabled={!selectedProject || !selectedTemplate || savingTemplate}
                className="rounded-2xl border border-line px-4 py-3 font-bold text-text disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingTemplate ? "Saving template..." : "Save as project template"}
              </button>
              {savedTemplateMessage ? (
                <p className="text-sm text-sub">{savedTemplateMessage}</p>
              ) : null}
            </div>
          </div>

          <CampaignForm
            projects={projects}
            defaultProjectId={selectedProject?.id}
            resetKey={`${selectedProject?.id || "none"}:${selectedTemplateId}`}
            initialValues={templatePlan?.campaignDraft}
            onSubmit={async (values) => {
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

              router.push(`/campaigns/${campaignId}`);
            }}
            submitLabel="Generate Campaign"
          />
        </div>
        ) : null}

        <BuilderBottomNav
          canGoBack={Boolean(previousStep)}
          onBack={() => previousStep && setCurrentStep(previousStep.id)}
          nextLabel={nextStep ? `Continue to ${nextStep.label}` : undefined}
          onNext={nextStep ? () => setCurrentStep(nextStep.id) : undefined}
          footerLabel={`${currentStepMeta.eyebrow} | ${currentStepMeta.label}`}
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
    <div className="rounded-2xl border border-line bg-card2 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
        {label}
      </p>
      <p className="mt-2 text-lg font-extrabold text-text">{value}</p>
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
    <div className="rounded-2xl border border-line bg-card px-4 py-4">
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

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <TemplateMeta
          label="Auto-filled"
          value={
            item.autofilledFields.length > 0
              ? item.autofilledFields.join(", ")
              : "Base defaults only"
          }
        />
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

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Quest title
          </span>
          <input
            value={item.draft.title}
            onChange={(event) => onEdit(item.key, "title", event.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
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
    <div className="rounded-2xl border border-line bg-card px-4 py-4">
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
          label="Auto-filled"
          value={
            item.autofilledFields.length > 0
              ? item.autofilledFields.join(", ")
              : "Base defaults only"
          }
        />
      </div>

      <div className="mt-3">
        <TemplateMeta
          label="Editable before generate"
          value="Title, description and reward cost"
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
            Reward title
          </span>
          <input
            value={item.draft.title}
            onChange={(event) => onEdit(item.key, "title", event.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
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
    <div className="rounded-2xl border border-line bg-card2 px-4 py-4">
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
    <div className="rounded-2xl border border-line bg-card px-4 py-4">
      <p className="text-sm font-bold text-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{description}</p>
      <p className="mt-3 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
