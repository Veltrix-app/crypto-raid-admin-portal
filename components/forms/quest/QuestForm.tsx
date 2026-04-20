"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  BuilderBottomNav,
  BuilderMetricCard,
  BuilderStepHeader,
} from "@/components/layout/builder/BuilderPrimitives";
import QuestMemberPreview from "@/components/forms/quest/QuestMemberPreview";
import QuestVerificationRail from "@/components/forms/quest/QuestVerificationRail";
import StudioModeToggle from "@/components/forms/studio/StudioModeToggle";
import StudioPreviewCard from "@/components/forms/studio/StudioPreviewCard";
import StudioShell from "@/components/forms/studio/StudioShell";
import StudioStepRail from "@/components/forms/studio/StudioStepRail";
import StudioTopFrame from "@/components/forms/studio/StudioTopFrame";
import StudioWarningRail from "@/components/forms/studio/StudioWarningRail";
import { AdminQuest } from "@/types/entities/quest";
import { AdminProject } from "@/types/entities/project";
import { AdminCampaign } from "@/types/entities/campaign";
import { getQuestVerificationPreview } from "@/lib/quest-verification";
import {
  getQuestMemberPreview,
  getQuestStudioFamilies,
  getQuestStudioFamily,
  getQuestStudioReadiness,
} from "@/lib/studio/quest-studio";

type Props = {
  projects: AdminProject[];
  campaigns: AdminCampaign[];
  initialValues?: Omit<AdminQuest, "id">;
  defaultProjectId?: string;
  defaultCampaignId?: string;
  onSubmit: (values: Omit<AdminQuest, "id">) => void | Promise<void>;
  submitLabel?: string;
};

type QuestBuilderStepId =
  | "blueprint"
  | "destination"
  | "verification"
  | "reward"
  | "preview"
  | "launch";

const QUEST_TYPE_PRESETS: Record<
  AdminQuest["questType"],
  {
    label: string;
    summary: string;
    platform: NonNullable<AdminQuest["platform"]>;
    actionLabel: string;
    proofRequired: boolean;
    proofType: AdminQuest["proofType"];
    verificationType: AdminQuest["verificationType"];
    verificationProvider?: NonNullable<AdminQuest["verificationProvider"]>;
    completionMode?: NonNullable<AdminQuest["completionMode"]>;
    type: string;
    recommendedConfig: string;
  }
> = {
  social_follow: {
    label: "Follow on X",
    summary: "Grow reach by asking contributors to follow a specific X account.",
    platform: "x",
    actionLabel: "Follow Account",
    proofRequired: false,
    proofType: "none",
    verificationType: "api_check",
    verificationProvider: "x",
    completionMode: "integration_auto",
    type: "Social",
    recommendedConfig: '{\n  "handle": "@veltrixapp"\n}',
  },
  social_like: {
    label: "Like a Post",
    summary: "Send users to a key announcement or launch post and track the engagement.",
    platform: "x",
    actionLabel: "Like Post",
    proofRequired: false,
    proofType: "none",
    verificationType: "api_check",
    type: "Social",
    recommendedConfig: '{\n  "postUrl": "https://x.com/..."\n}',
  },
  social_repost: {
    label: "Repost a Post",
    summary: "Amplify campaign messages with repost-driven reach.",
    platform: "x",
    actionLabel: "Repost Post",
    proofRequired: false,
    proofType: "none",
    verificationType: "api_check",
    type: "Social",
    recommendedConfig: '{\n  "postUrl": "https://x.com/..."\n}',
  },
  social_comment: {
    label: "Comment on X",
    summary: "Drive social proof by sending users to comment on a target post.",
    platform: "x",
    actionLabel: "Comment on Post",
    proofRequired: true,
    proofType: "url",
    verificationType: "manual_review",
    type: "Social",
    recommendedConfig: '{\n  "postUrl": "https://x.com/...",\n  "keyword": "Veltrix"\n}',
  },
  telegram_join: {
    label: "Join Telegram",
    summary: "Route campaign traffic into a Telegram community or announcement hub.",
    platform: "telegram",
    actionLabel: "Join Telegram",
    proofRequired: false,
    proofType: "none",
    verificationType: "bot_check",
    verificationProvider: "telegram",
    completionMode: "integration_auto",
    type: "Community",
    recommendedConfig: '{\n  "groupUrl": "https://t.me/..."\n}',
  },
  discord_join: {
    label: "Join Discord",
    summary: "Build owned community presence inside the project's Discord.",
    platform: "discord",
    actionLabel: "Join Discord",
    proofRequired: false,
    proofType: "none",
    verificationType: "bot_check",
    verificationProvider: "discord",
    completionMode: "integration_auto",
    type: "Community",
    recommendedConfig: '{\n  "inviteUrl": "https://discord.gg/..."\n}',
  },
  wallet_connect: {
    label: "Connect Wallet",
    summary: "Use wallet connection as the first trust and identity checkpoint.",
    platform: "wallet",
    actionLabel: "Connect Wallet",
    proofRequired: false,
    proofType: "wallet",
    verificationType: "onchain_check",
    type: "Wallet",
    recommendedConfig: '{\n  "chain": "ethereum"\n}',
  },
  token_hold: {
    label: "Hold Token",
    summary: "Gate campaign progress behind token ownership or balance thresholds.",
    platform: "wallet",
    actionLabel: "Verify Token Holdings",
    proofRequired: false,
    proofType: "wallet",
    verificationType: "onchain_check",
    type: "Wallet",
    recommendedConfig: '{\n  "contractAddress": "0x...",\n  "minimumBalance": 100\n}',
  },
  nft_hold: {
    label: "Hold NFT",
    summary: "Target collectors or holders with ownership-based access.",
    platform: "wallet",
    actionLabel: "Verify NFT",
    proofRequired: false,
    proofType: "wallet",
    verificationType: "onchain_check",
    type: "Wallet",
    recommendedConfig: '{\n  "contractAddress": "0x...",\n  "minimumOwned": 1\n}',
  },
  onchain_tx: {
    label: "Complete Onchain Action",
    summary: "Track a swap, mint or contract interaction with an onchain verifier.",
    platform: "wallet",
    actionLabel: "Complete Onchain Action",
    proofRequired: false,
    proofType: "tx_hash",
    verificationType: "onchain_check",
    type: "Onchain",
    recommendedConfig: '{\n  "contractAddress": "0x...",\n  "method": "swapExactTokensForTokens"\n}',
  },
  url_visit: {
    label: "Visit Page",
    summary: "Send users into landing pages, docs or partner experiences.",
    platform: "website",
    actionLabel: "Open Page",
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    verificationProvider: "website",
    completionMode: "integration_auto",
    type: "Traffic",
    recommendedConfig:
      '{\n  "targetUrl": "https://veltrix.app/docs",\n  "integrationProvider": "website",\n  "eventType": "website_visit_confirmed"\n}',
  },
  referral: {
    label: "Invite Friends",
    summary: "Turn contributors into growth channels with referral-based quests.",
    platform: "custom",
    actionLabel: "Share Referral Link",
    proofRequired: false,
    proofType: "text",
    verificationType: "hybrid",
    type: "Growth",
    recommendedConfig: '{\n  "minimumReferrals": 3\n}',
  },
  manual_proof: {
    label: "Manual Proof",
    summary: "Collect screenshots, links or written proof for custom actions.",
    platform: "custom",
    actionLabel: "Submit Proof",
    proofRequired: true,
    proofType: "image",
    verificationType: "manual_review",
    type: "Proof",
    recommendedConfig: '{\n  "instructions": "Upload a screenshot that clearly shows completion."\n}',
  },
  custom: {
    label: "Custom Task",
    summary: "Use a flexible template when the quest doesn't fit a standard mechanic yet.",
    platform: "custom",
    actionLabel: "Open Task",
    proofRequired: true,
    proofType: "text",
    verificationType: "manual_review",
    type: "Custom",
    recommendedConfig: '{\n  "notes": "Define your own verification rules."\n}',
  },
};

const questBuilderSteps: Array<{
  id: QuestBuilderStepId;
  label: string;
  description: string;
}> = [
  {
    id: "blueprint",
    label: "Action",
    description: "Choose the mission family and concrete mechanic that best matches the contributor action.",
  },
  {
    id: "destination",
    label: "Placement",
    description: "Place the quest inside the right project and campaign, then shape the CTA and copy.",
  },
  {
    id: "verification",
    label: "Wire verification",
    description: "Make the proof path and verification route feel intentional before launch.",
  },
  {
    id: "reward",
    label: "Reward",
    description: "Tune XP, repeatability, and mission pressure without drowning in advanced controls.",
  },
  {
    id: "preview",
    label: "Member view",
    description: "Check how the quest feels in the app before you worry about final state.",
  },
  {
    id: "launch",
    label: "Review and launch",
    description: "Set timing, status, and the final launch posture before saving the quest.",
  },
];

export default function QuestForm({
  projects,
  campaigns,
  initialValues,
  defaultProjectId,
  defaultCampaignId,
  onSubmit,
  submitLabel = "Save Quest",
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<QuestBuilderStepId>("blueprint");
  const [builderMode, setBuilderMode] = useState<"basic" | "advanced">("basic");
  const [values, setValues] = useState<Omit<AdminQuest, "id">>(
    initialValues || {
      projectId: defaultProjectId || projects[0]?.id || "",
      campaignId: defaultCampaignId || "",
      title: "",
      description: "",
      shortDescription: "",
      type: "Task",
      questType: "custom",
      platform: "custom",
      xp: 0,
      actionLabel: "Open Task",
      actionUrl: "",
      proofRequired: false,
      proofType: "none",
      autoApprove: false,
      verificationType: "manual_review",
      verificationProvider: "custom",
      completionMode: "manual",
      verificationConfig: "",
      isRepeatable: false,
      cooldownSeconds: undefined,
      maxCompletionsPerUser: undefined,
      sortOrder: 0,
      startsAt: "",
      endsAt: "",
      status: "draft",
    }
  );
  const [selectedPreset, setSelectedPreset] = useState<AdminQuest["questType"]>(
    initialValues?.questType || "custom"
  );
  const [selectedFamily, setSelectedFamily] = useState(
    getQuestStudioFamily(initialValues?.questType || "custom").id
  );

  const families = useMemo(() => getQuestStudioFamilies(), []);
  const filteredCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.projectId === values.projectId),
    [campaigns, values.projectId]
  );
  const selectedProject = projects.find((project) => project.id === values.projectId);
  const verificationPreview = useMemo(() => getQuestVerificationPreview(values), [values]);
  const memberPreview = useMemo(() => getQuestMemberPreview(values), [values]);
  const readinessItems = useMemo(
    () =>
      getQuestStudioReadiness({
        values,
        project: selectedProject,
        campaignCount: filteredCampaigns.length,
      }),
    [filteredCampaigns.length, selectedProject, values]
  );
  const currentStepIndex = questBuilderSteps.findIndex((step) => step.id === currentStep);
  const currentStepMeta = questBuilderSteps[currentStepIndex];
  const previousStep = questBuilderSteps[currentStepIndex - 1];
  const nextStep = questBuilderSteps[currentStepIndex + 1];
  const progressPercent = Math.round(((currentStepIndex + 1) / questBuilderSteps.length) * 100);
  const presetsForFamily = families.find((family) => family.id === selectedFamily)?.questTypes ?? [];
  const stepCompletion: Record<QuestBuilderStepId, boolean> = {
    blueprint: Boolean(values.questType),
    destination: Boolean(values.projectId && values.campaignId && values.title && values.actionLabel),
    verification:
      !verificationPreview.invalidConfig && verificationPreview.missingConfigKeys.length === 0,
    reward: values.xp > 0,
    preview: Boolean(values.shortDescription || values.description),
    launch: Boolean(values.status),
  };
  const stepRailItems = useMemo(
    () =>
      questBuilderSteps.map((step, index) => ({
        id: step.id,
        label: step.label,
        shortLabel: String(index + 1),
        complete:
          stepCompletion[step.id] &&
          questBuilderSteps.findIndex((candidate) => candidate.id === step.id) < currentStepIndex,
      })),
    [currentStepIndex, stepCompletion]
  );
  const questWarningItems = useMemo(
    () => [
      ...readinessItems
        .filter((item) => !item.complete)
        .map((item) => ({
          label: item.label,
          description: item.value,
          tone: "warning" as const,
        })),
      ...(verificationPreview.invalidConfig
        ? [
            {
              label: "Verification config",
              description: "The JSON config is invalid and needs to be fixed before launch.",
              tone: "warning" as const,
            },
          ]
        : []),
      ...verificationPreview.missingConfigKeys.map((key) => ({
        label: `Missing ${key}`,
        description: "This verification setting is still required for confident automation.",
        tone: "warning" as const,
      })),
    ],
    [readinessItems, verificationPreview.invalidConfig, verificationPreview.missingConfigKeys]
  );

  useEffect(() => {
    if (!values.projectId && defaultProjectId) {
      setValues((current) => ({ ...current, projectId: defaultProjectId }));
    }
  }, [defaultProjectId, values.projectId]);

  useEffect(() => {
    if (!defaultCampaignId || !filteredCampaigns.length) {
      return;
    }

    const hasDefaultCampaign = filteredCampaigns.some(
      (campaign) => campaign.id === defaultCampaignId
    );
    if (hasDefaultCampaign && values.campaignId !== defaultCampaignId) {
      setValues((current) => ({ ...current, campaignId: defaultCampaignId }));
    }
  }, [defaultCampaignId, filteredCampaigns, values.campaignId]);

  useEffect(() => {
    if (!filteredCampaigns.length) {
      if (values.campaignId) {
        setValues((current) => ({ ...current, campaignId: "" }));
      }
      return;
    }

    const hasSelectedCampaign = filteredCampaigns.some(
      (campaign) => campaign.id === values.campaignId
    );

    if (!hasSelectedCampaign) {
      setValues((current) => ({
        ...current,
        campaignId: filteredCampaigns[0]?.id || "",
      }));
    }
  }, [filteredCampaigns, values.campaignId]);

  useEffect(() => {
    setSelectedFamily(getQuestStudioFamily(selectedPreset).id);
  }, [selectedPreset]);

  function applyPreset(questType: AdminQuest["questType"]) {
    const preset = QUEST_TYPE_PRESETS[questType];
    setSelectedPreset(questType);
    setValues((current) => ({
      ...current,
      questType,
      platform: preset.platform,
      actionLabel: preset.actionLabel,
      proofRequired: preset.proofRequired,
      proofType: preset.proofType,
      verificationType: preset.verificationType,
      verificationProvider: preset.verificationProvider ?? "custom",
      completionMode:
        preset.completionMode ??
        (preset.verificationType === "manual_review"
          ? "manual"
          : preset.verificationType === "hybrid"
            ? "hybrid"
            : "rule_auto"),
      verificationConfig:
        current.verificationConfig?.trim() && current.questType === questType
          ? current.verificationConfig
          : preset.recommendedConfig,
      type: preset.type,
    }));
  }

  function validateStep(step: QuestBuilderStepId) {
    if (step === "blueprint" && !values.questType) {
      return "Pick a mission blueprint before continuing.";
    }

    if (step === "destination" && !(values.projectId && values.campaignId && values.title.trim())) {
      return "Set the project, campaign and quest title before continuing.";
    }

    if (
      step === "verification" &&
      (verificationPreview.invalidConfig || verificationPreview.missingConfigKeys.length > 0)
    ) {
      return "Complete the verification config before continuing.";
    }

    if (step === "reward" && values.xp <= 0) {
      return "Set an XP amount before continuing.";
    }

    return null;
  }

  function attemptStepNavigation(targetStep: QuestBuilderStepId) {
    const targetIndex = questBuilderSteps.findIndex((step) => step.id === targetStep);

    if (targetIndex <= currentStepIndex) {
      setCurrentStep(targetStep);
      setStepError(null);
      return;
    }

    for (let index = currentStepIndex; index < targetIndex; index += 1) {
      const step = questBuilderSteps[index];
      const error = validateStep(step.id);
      if (error) {
        setCurrentStep(step.id);
        setStepError(error);
        return;
      }
    }

    setCurrentStep(targetStep);
    setStepError(null);
  }

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);

        try {
          await onSubmit(values);
        } catch (error: any) {
          setSubmitError(error?.message || "Failed to save quest.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <StudioShell
        eyebrow="Quest Studio"
        title="Build the member action before you tune the admin knobs"
        description="Pick the mission family, place the quest in the right campaign, wire verification clearly, and keep the member-facing preview in view the whole time."
        progressPercent={progressPercent}
        steps={questBuilderSteps.map((step, index) => ({
          ...step,
          eyebrow: `Step ${index + 1}`,
          complete: stepCompletion[step.id],
        }))}
        currentStep={currentStep}
        onSelectStep={attemptStepNavigation}
        topFrame={
          <StudioTopFrame
            eyebrow="Quest Studio"
            title="Build the member action before you tune the admin knobs"
            description="Treat a quest like one precise contributor experience. Shape the action, lock the verification route, then check the member-facing card before you launch."
            actions={
              <StudioModeToggle
                label="Builder mode"
                value={builderMode}
                onChange={setBuilderMode}
                options={[
                  {
                    value: "basic",
                    label: "Basic",
                    eyebrow: "Launch-safe path",
                  },
                  {
                    value: "advanced",
                    label: "Advanced",
                    eyebrow: "Operator controls",
                  },
                ]}
              />
            }
            context={
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/8 bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-text">
                  {selectedProject?.name || "No workspace"}
                </span>
                <span className="rounded-full border border-white/8 bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  {filteredCampaigns.find((campaign) => campaign.id === values.campaignId)?.title ||
                    "No campaign"}
                </span>
                <span className="rounded-full border border-white/8 bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  {getQuestStudioFamily(selectedPreset).label}
                </span>
              </div>
            }
            supporting={
              <div className="grid gap-3 md:grid-cols-3">
                <BuilderMetricCard label="Blueprint" value={QUEST_TYPE_PRESETS[selectedPreset].label} />
                <BuilderMetricCard label="Verification route" value={verificationPreview.routeLabel} />
                <BuilderMetricCard
                  label="Completion mode"
                  value={(values.completionMode || "manual").replace(/_/g, " ")}
                />
              </div>
            }
          />
        }
        leftRail={
          <StudioStepRail
            steps={stepRailItems}
            currentStep={currentStep}
            onSelect={attemptStepNavigation}
          />
        }
        rightRail={
          <>
            <StudioPreviewCard
              title="Member preview"
              eyebrow="Quest card"
              description="The member card stays visible throughout the build so the quest never drifts into operator-only language."
            >
              <QuestMemberPreview preview={memberPreview} />
            </StudioPreviewCard>

            <StudioWarningRail
              title="Quest watchlist"
              items={[
                ...(stepError
                  ? [
                      {
                        label: "Current blocker",
                        description: stepError,
                        tone: "warning" as const,
                      },
                    ]
                  : []),
                ...(submitError
                  ? [
                      {
                        label: "Save failed",
                        description: submitError,
                        tone: "warning" as const,
                      },
                    ]
                  : []),
                ...questWarningItems,
              ]}
            />
          </>
        }
        canvasClassName="space-y-6"
      >
        <div className="space-y-6">
          <BuilderStepHeader
            eyebrow={`Step ${currentStepIndex + 1}`}
            title={currentStepMeta.label}
            description={currentStepMeta.description}
            stepIndex={currentStepIndex + 1}
            totalSteps={questBuilderSteps.length}
          />

          {currentStep === "blueprint" ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  Mission Families
                </p>
                <div className="mt-3 grid gap-3 xl:grid-cols-2">
                  {families.map((family) => {
                    const active = family.id === selectedFamily;

                    return (
                      <button
                        key={family.id}
                        type="button"
                        onClick={() => setSelectedFamily(family.id)}
                        className={`rounded-[24px] border p-4 text-left transition ${
                          active
                            ? "border-primary/40 bg-[linear-gradient(135deg,rgba(199,255,0,0.12),rgba(255,255,255,0.04))]"
                            : "border-line bg-card2 hover:border-primary/40"
                        }`}
                      >
                        <p className="text-sm font-bold text-text">{family.label}</p>
                        <p className="mt-2 text-sm leading-6 text-sub">{family.summary}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  Blueprint
                </p>
                <div className="mt-3 grid gap-3 xl:grid-cols-2">
                  {presetsForFamily.map((questType) => {
                    const preset = QUEST_TYPE_PRESETS[questType];
                    const isActive = selectedPreset === questType;

                    return (
                      <button
                        key={questType}
                        type="button"
                        onClick={() => applyPreset(questType)}
                        className={`rounded-[24px] border p-4 text-left transition ${
                          isActive
                            ? "border-primary/40 bg-[linear-gradient(135deg,rgba(199,255,0,0.12),rgba(255,255,255,0.04))]"
                            : "border-line bg-card2 hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-text">{preset.label}</p>
                            <p className="mt-2 text-sm leading-6 text-sub">{preset.summary}</p>
                          </div>
                          <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-text">
                            {preset.platform}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === "destination" ? (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Project">
                  <select
                    value={values.projectId}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        projectId: e.target.value,
                        campaignId: "",
                      })
                    }
                    className={getInputClassName()}
                    required
                  >
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Campaign">
                  <select
                    value={values.campaignId}
                    onChange={(e) => setValues({ ...values, campaignId: e.target.value })}
                    className={getInputClassName()}
                    required
                  >
                    <option value="">Select campaign</option>
                    {filteredCampaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Quest title">
                  <input
                    value={values.title}
                    onChange={(e) => setValues({ ...values, title: e.target.value })}
                    className={getInputClassName()}
                    placeholder="Follow Chainwars on X"
                  />
                </Field>

                <Field label="Short description">
                  <input
                    value={values.shortDescription || ""}
                    onChange={(e) => setValues({ ...values, shortDescription: e.target.value })}
                    className={getInputClassName()}
                    placeholder="Follow the official account"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Description">
                    <textarea
                      value={values.description}
                      onChange={(e) => setValues({ ...values, description: e.target.value })}
                      rows={4}
                      className={getInputClassName()}
                      placeholder="Explain exactly what contributors should do and why it matters."
                    />
                  </Field>
                </div>

                <Field label="Action label">
                  <input
                    value={values.actionLabel}
                    onChange={(e) => setValues({ ...values, actionLabel: e.target.value })}
                    className={getInputClassName()}
                    placeholder="Follow on X"
                  />
                </Field>

                <Field label="Action URL">
                  <input
                    value={values.actionUrl || ""}
                    onChange={(e) => setValues({ ...values, actionUrl: e.target.value })}
                    className={getInputClassName()}
                    placeholder="https://..."
                  />
                </Field>
              </div>

              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm text-sub">
                <span className="font-semibold text-text">Studio hint:</span> this is the point where the quest becomes real for the member. Make the title, subcopy and CTA feel like one clean action, not three unrelated fields.
              </div>
            </div>
          ) : null}

          {currentStep === "verification" ? (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <ToggleField
                  label="Proof required"
                  checked={values.proofRequired}
                  onChange={(checked) =>
                    setValues({
                      ...values,
                      proofRequired: checked,
                      proofType: checked ? values.proofType : "none",
                    })
                  }
                />

                <ToggleField
                  label="Auto approve"
                  checked={values.autoApprove}
                  onChange={(checked) =>
                    setValues({
                      ...values,
                      autoApprove: checked,
                      completionMode:
                        values.completionMode === "integration_auto"
                          ? "integration_auto"
                          : checked
                            ? "rule_auto"
                            : values.verificationType === "hybrid"
                              ? "hybrid"
                              : "manual",
                    })
                  }
                />

                <Field label="Proof type">
                  <select
                    value={values.proofType}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        proofType: e.target.value as AdminQuest["proofType"],
                      })
                    }
                    className={getInputClassName()}
                  >
                    <option value="none">none</option>
                    <option value="text">text</option>
                    <option value="url">url</option>
                    <option value="image">image</option>
                    <option value="wallet">wallet</option>
                    <option value="tx_hash">tx_hash</option>
                  </select>
                </Field>

                <Field label="Verification type">
                  <select
                    value={values.verificationType}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        verificationType: e.target.value as AdminQuest["verificationType"],
                        completionMode:
                          e.target.value === "hybrid"
                            ? "hybrid"
                            : e.target.value === "manual_review"
                              ? "manual"
                              : values.verificationProvider === "website" &&
                                  values.questType === "url_visit"
                                ? "integration_auto"
                                : values.autoApprove
                                  ? "rule_auto"
                                  : "manual",
                      })
                    }
                    className={getInputClassName()}
                  >
                    <option value="api_check">api_check</option>
                    <option value="bot_check">bot_check</option>
                    <option value="onchain_check">onchain_check</option>
                    <option value="event_check">event_check</option>
                    <option value="manual_review">manual_review</option>
                    <option value="hybrid">hybrid</option>
                  </select>
                </Field>

                {builderMode === "advanced" ? (
                  <>
                    <Field label="Platform">
                      <select
                        value={values.platform || "custom"}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            platform: e.target.value as AdminQuest["platform"],
                          })
                        }
                        className={getInputClassName()}
                      >
                        <option value="x">x</option>
                        <option value="telegram">telegram</option>
                        <option value="discord">discord</option>
                        <option value="wallet">wallet</option>
                        <option value="website">website</option>
                        <option value="custom">custom</option>
                      </select>
                    </Field>

                    <Field label="Completion mode">
                      <select
                        value={values.completionMode || "manual"}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            completionMode: e.target.value as NonNullable<AdminQuest["completionMode"]>,
                          })
                        }
                        className={getInputClassName()}
                      >
                        <option value="manual">manual</option>
                        <option value="rule_auto">rule_auto</option>
                        <option value="integration_auto">integration_auto</option>
                        <option value="hybrid">hybrid</option>
                      </select>
                    </Field>
                  </>
                ) : null}

                <div className="md:col-span-2">
                  <Field label="Verification config (JSON)">
                    <textarea
                      value={values.verificationConfig || ""}
                      onChange={(e) =>
                        setValues({ ...values, verificationConfig: e.target.value })
                      }
                      rows={5}
                      className={getInputClassName()}
                      placeholder={QUEST_TYPE_PRESETS[selectedPreset].recommendedConfig}
                    />
                  </Field>
                </div>
              </div>

              <QuestVerificationRail
                preview={verificationPreview}
                verificationProvider={values.verificationProvider}
                proofRequired={values.proofRequired}
                proofType={values.proofType}
              />
            </div>
          ) : null}

          {currentStep === "reward" ? (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="XP">
                  <input
                    type="number"
                    min={0}
                    value={values.xp}
                    onChange={(e) => setValues({ ...values, xp: Number(e.target.value) })}
                    className={getInputClassName()}
                  />
                </Field>

                <Field label="Quest type label">
                  <input
                    value={values.type}
                    onChange={(e) => setValues({ ...values, type: e.target.value })}
                    className={getInputClassName()}
                    placeholder="Social"
                  />
                </Field>

                <ToggleField
                  label="Repeatable"
                  checked={values.isRepeatable}
                  onChange={(checked) =>
                    setValues({ ...values, isRepeatable: checked })
                  }
                />

                {builderMode === "advanced" ? (
                  <>
                    <Field label="Cooldown seconds">
                      <input
                        type="number"
                        min={0}
                        value={values.cooldownSeconds ?? ""}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            cooldownSeconds:
                              e.target.value === "" ? undefined : Number(e.target.value),
                          })
                        }
                        className={getInputClassName()}
                      />
                    </Field>

                    <Field label="Max completions per user">
                      <input
                        type="number"
                        min={0}
                        value={values.maxCompletionsPerUser ?? ""}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            maxCompletionsPerUser:
                              e.target.value === "" ? undefined : Number(e.target.value),
                          })
                        }
                        className={getInputClassName()}
                      />
                    </Field>

                    <Field label="Sort order">
                      <input
                        type="number"
                        min={0}
                        value={values.sortOrder}
                        onChange={(e) =>
                          setValues({ ...values, sortOrder: Number(e.target.value) })
                        }
                        className={getInputClassName()}
                      />
                    </Field>
                  </>
                ) : null}
              </div>

              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm text-sub">
                <span className="font-semibold text-text">Studio hint:</span> XP is not just a reward number. It signals how important the mission is inside the lane, so use it to create pressure and hierarchy, not only payout.
              </div>
            </div>
          ) : null}

          {currentStep === "preview" ? (
            <div className="space-y-6">
              <StudioPreviewCard
                title="Member-facing quest card"
                eyebrow="Quest preview"
                description="This is the operator check for whether the quest feels clear, motivating, and launch-safe from the member side."
              >
                <QuestMemberPreview preview={memberPreview} />
              </StudioPreviewCard>

              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-sub">
                The strongest quest builders make the member experience obvious before launch. If this card feels confusing here, it will feel confusing in the app too.
              </div>
            </div>
          ) : null}

          {currentStep === "launch" ? (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Starts at">
                  <input
                    type="datetime-local"
                    value={values.startsAt || ""}
                    onChange={(e) => setValues({ ...values, startsAt: e.target.value })}
                    className={getInputClassName()}
                  />
                </Field>

                <Field label="Ends at">
                  <input
                    type="datetime-local"
                    value={values.endsAt || ""}
                    onChange={(e) => setValues({ ...values, endsAt: e.target.value })}
                    className={getInputClassName()}
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={values.status}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        status: e.target.value as AdminQuest["status"],
                      })
                    }
                    className={getInputClassName()}
                  >
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="archived">archived</option>
                  </select>
                </Field>
              </div>

              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-sub">
                This save will route you into the quest detail surface, where you can still operate and configure the mission after the first launch pass.
              </div>
            </div>
          ) : null}

          <BuilderBottomNav
            canGoBack={Boolean(previousStep)}
            onBack={() => previousStep && setCurrentStep(previousStep.id)}
            nextLabel={nextStep ? `Continue to ${nextStep.label}` : undefined}
            onNext={nextStep ? () => attemptStepNavigation(nextStep.id) : undefined}
            footerLabel={`Step ${currentStepIndex + 1} - ${currentStepMeta.label}`}
            submitButton={
              nextStep ? undefined : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl bg-primary px-5 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving..." : submitLabel}
                </button>
              )
            }
          />
        </div>
      </StudioShell>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold tracking-[-0.01em] text-text">
        {label}
      </span>
      {children}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <span className="pr-4 text-sm font-semibold text-text">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-lime-400"
      />
    </label>
  );
}

function getInputClassName() {
  return "w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 outline-none";
}
