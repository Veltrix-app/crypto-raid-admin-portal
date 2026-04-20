"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BuilderBottomNav,
  BuilderHero,
  BuilderMetricCard,
  BuilderSidebarCard,
  BuilderSidebarStack,
  BuilderStepHeader,
  BuilderStepRail,
} from "@/components/layout/builder/BuilderPrimitives";
import { AdminQuest } from "@/types/entities/quest";
import { AdminProject } from "@/types/entities/project";
import { AdminCampaign } from "@/types/entities/campaign";
import { getQuestVerificationPreview } from "@/lib/quest-verification";

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
  | "setup"
  | "logic"
  | "verification"
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
    label: "Pick blueprint",
    description: "Start from the mechanic that best matches the contributor action you want.",
  },
  {
    id: "setup",
    label: "Set destination",
    description: "Place the quest inside the right project and campaign, then define its core copy.",
  },
  {
    id: "logic",
    label: "Shape quest logic",
    description: "Tune quest type, platform, XP, CTA, and the contributor journey.",
  },
  {
    id: "verification",
    label: "Proof and verification",
    description: "Decide how the quest is checked and what signals route it into review.",
  },
  {
    id: "launch",
    label: "Review and launch",
    description: "Set limits, timing, and launch readiness before saving the quest.",
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
  const [currentStep, setCurrentStep] = useState<QuestBuilderStepId>("blueprint");
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

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => campaign.projectId === values.projectId);
  }, [campaigns, values.projectId]);
  const activePreset = QUEST_TYPE_PRESETS[selectedPreset];
  const selectedProject = projects.find((project) => project.id === values.projectId);
  const verificationPreview = useMemo(
    () => getQuestVerificationPreview(values),
    [values]
  );
  const currentStepIndex = questBuilderSteps.findIndex((step) => step.id === currentStep);
  const currentStepMeta = questBuilderSteps[currentStepIndex];
  const previousStep = questBuilderSteps[currentStepIndex - 1];
  const nextStep = questBuilderSteps[currentStepIndex + 1];
  const progressPercent = Math.round(((currentStepIndex + 1) / questBuilderSteps.length) * 100);
  const featuredBlueprints = [
    "social_follow",
    "telegram_join",
    "wallet_connect",
    "token_hold",
    "manual_proof",
    "referral",
  ] as AdminQuest["questType"][];
  const readinessItems = [
    {
      label: "Project placement",
      value: values.projectId && values.campaignId ? "Ready" : "Missing project or campaign",
      complete: Boolean(values.projectId && values.campaignId),
    },
    {
      label: "Destination",
      value: values.actionUrl ? "Connected" : "Add an action URL",
      complete: Boolean(values.actionUrl),
    },
    {
      label: "Verification",
      value: verificationPreview.routeLabel,
      complete:
        !verificationPreview.invalidConfig &&
        verificationPreview.missingConfigKeys.length === 0,
    },
    {
      label: "Proof flow",
      value: values.proofRequired ? values.proofType : "No proof required",
      complete: !values.proofRequired || values.proofType !== "none",
    },
  ];
  const stepCompletion: Record<QuestBuilderStepId, boolean> = {
    blueprint: Boolean(values.questType),
    setup: Boolean(values.projectId && values.campaignId && values.title && values.description),
    logic: Boolean(values.actionLabel && values.platform),
    verification:
      !verificationPreview.invalidConfig &&
      verificationPreview.missingConfigKeys.length === 0,
    launch: Boolean(values.status),
  };

  useEffect(() => {
    if (!values.projectId && defaultProjectId) {
      setValues((current) => ({ ...current, projectId: defaultProjectId }));
    }
  }, [defaultProjectId, values.projectId]);

  useEffect(() => {
    if (!defaultCampaignId || !filteredCampaigns.length) {
      return;
    }

    const hasDefaultCampaign = filteredCampaigns.some((campaign) => campaign.id === defaultCampaignId);
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
      <BuilderHero
        eyebrow="Quest Builder Wizard"
        title="Build the quest one decision at a time"
        description="Choose the mechanic, connect the destination, define verification, and launch with much less noise on screen."
        progressPercent={progressPercent}
        metrics={
          <>
            <BuilderMetricCard label="Blueprint" value={activePreset.label} />
            <BuilderMetricCard label="Verification route" value={verificationPreview.routeLabel} />
            <BuilderMetricCard
              label="Completion mode"
              value={(values.completionMode || "manual").replace(/_/g, " ")}
            />
            <BuilderMetricCard
              label="Missing config"
              value={verificationPreview.invalidConfig ? "Invalid JSON" : String(verificationPreview.missingConfigKeys.length)}
            />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,19,28,0.94),rgba(10,12,18,0.92))] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
            <BuilderStepRail
              steps={questBuilderSteps.map((step, index) => ({
                ...step,
                eyebrow: `Step ${index + 1}`,
                complete: stepCompletion[step.id],
              }))}
              currentStep={currentStep}
              onSelect={setCurrentStep}
            />
          </div>

          <div className="space-y-6 rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,19,28,0.98),rgba(10,12,18,0.96))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <BuilderStepHeader
            eyebrow={`Step ${currentStepIndex + 1}`}
            title={currentStepMeta.label}
            description={currentStepMeta.description}
            stepIndex={currentStepIndex + 1}
            totalSteps={questBuilderSteps.length}
          />

      {currentStep === "blueprint" ? (
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Quest Blueprint
        </p>

        <div className="grid gap-3 xl:grid-cols-2">
          {featuredBlueprints.map((questType) => {
            const preset = QUEST_TYPE_PRESETS[questType];
            const isActive = values.questType === questType;

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

        <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">{activePreset.label}</p>
              <p className="mt-2 text-sm leading-6 text-sub">{activePreset.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
              <span className="rounded-full bg-white/5 px-3 py-1 text-text">{activePreset.type}</span>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">{activePreset.platform}</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-text">{activePreset.verificationType}</span>
            </div>
          </div>
        </div>
      </div>
      ) : null}

      {currentStep === "setup" ? (
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          General
        </p>

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
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
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
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
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

          <Field label="Quest Title">
            <input
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              required
            />
          </Field>

          <Field label="Legacy Type">
            <input
              value={values.type}
              onChange={(e) => setValues({ ...values, type: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="Task"
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
            rows={5}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            required
          />
        </Field>

        {selectedProject ? (
          <p className="text-sm text-sub">
            This quest will be created inside <span className="font-semibold text-text">{selectedProject.name}</span>
            {filteredCampaigns.length
              ? ` with ${filteredCampaigns.length} available campaign${filteredCampaigns.length === 1 ? "" : "s"} in this workspace.`
              : " but this project still needs a campaign before the quest can go live."}
          </p>
        ) : null}

        <Field label="Short Description">
          <textarea
            value={values.shortDescription || ""}
            onChange={(e) =>
              setValues({ ...values, shortDescription: e.target.value })
            }
            rows={3}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </Field>
      </div>
      ) : null}

      {currentStep === "logic" ? (
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Quest Logic
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Quest Type">
            <select
              value={values.questType}
              onChange={(e) =>
                applyPreset(e.target.value as AdminQuest["questType"])
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="social_follow">social_follow</option>
              <option value="social_like">social_like</option>
              <option value="social_repost">social_repost</option>
              <option value="social_comment">social_comment</option>
              <option value="telegram_join">telegram_join</option>
              <option value="discord_join">discord_join</option>
              <option value="wallet_connect">wallet_connect</option>
              <option value="token_hold">token_hold</option>
              <option value="nft_hold">nft_hold</option>
              <option value="onchain_tx">onchain_tx</option>
              <option value="url_visit">url_visit</option>
              <option value="referral">referral</option>
              <option value="manual_proof">manual_proof</option>
              <option value="custom">custom</option>
            </select>
          </Field>

          <Field label="Platform">
            <select
              value={values.platform || "custom"}
              onChange={(e) =>
                setValues({
                  ...values,
                  platform: e.target.value as AdminQuest["platform"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="x">x</option>
              <option value="telegram">telegram</option>
              <option value="discord">discord</option>
              <option value="wallet">wallet</option>
              <option value="website">website</option>
              <option value="custom">custom</option>
            </select>
          </Field>

          <Field label="XP">
            <input
              type="number"
              min={0}
              value={values.xp}
              onChange={(e) =>
                setValues({ ...values, xp: Number(e.target.value) })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>

          <Field label="Action Label">
            <input
              value={values.actionLabel}
              onChange={(e) =>
                setValues({ ...values, actionLabel: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="Open Task"
            />
          </Field>

          <Field label="Action URL">
            <input
              value={values.actionUrl || ""}
              onChange={(e) =>
                setValues({ ...values, actionUrl: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://..."
            />
          </Field>
        </div>

        <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm text-sub">
          <span className="font-semibold text-text">Builder hint:</span> use the action label and URL as the exact CTA contributors will see in the app. For social or onchain quests, point this directly at the target destination so the flow feels one-tap.
        </div>
      </div>
      ) : null}

      {currentStep === "verification" ? (
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Proof & Verification
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <ToggleField
            label="Proof Required"
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
            label="Auto Approve"
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

          <Field label="Proof Type">
            <select
              value={values.proofType}
              onChange={(e) =>
                setValues({
                  ...values,
                  proofType: e.target.value as AdminQuest["proofType"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="none">none</option>
              <option value="text">text</option>
              <option value="url">url</option>
              <option value="image">image</option>
              <option value="wallet">wallet</option>
              <option value="tx_hash">tx_hash</option>
            </select>
          </Field>

          <Field label="Verification Type">
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
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="api_check">api_check</option>
              <option value="bot_check">bot_check</option>
              <option value="onchain_check">onchain_check</option>
              <option value="event_check">event_check</option>
              <option value="manual_review">manual_review</option>
              <option value="hybrid">hybrid</option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Verification Config (JSON)">
              <textarea
                value={values.verificationConfig || ""}
                onChange={(e) =>
                  setValues({ ...values, verificationConfig: e.target.value })
                }
                rows={5}
                className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
                placeholder={activePreset.recommendedConfig}
              />
            </Field>
            <p className="mt-2 text-sm text-sub">
              Start from the recommended config for <span className="font-semibold text-text">{activePreset.label}</span> and adjust the values to match this campaign.
            </p>
            {values.verificationProvider === "website" &&
            values.completionMode === "integration_auto" ? (
              <p className="mt-3 text-sm leading-6 text-primary">
                This route is ready for tracked website verification. Contributors should complete the visit without uploading proof once the integration endpoint is wired.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-text">Verification Routing</p>
              <p className="mt-2 text-sm leading-6 text-sub">
                {verificationPreview.routeDescription}
              </p>
            </div>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
              {verificationPreview.routeLabel}
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <RouteInfoCard
              label="Proof expectation"
              value={verificationPreview.proofExpectation}
            />
            <RouteInfoCard
              label="Provider"
              value={(values.verificationProvider || "custom").replace(/_/g, " ")}
            />
            <RouteInfoCard
              label="Required config"
              value={
                verificationPreview.requiredConfigKeys.length
                  ? verificationPreview.requiredConfigKeys.join(", ")
                  : "No required keys"
              }
            />
            <RouteInfoCard
              label="Missing keys"
              value={
                verificationPreview.invalidConfig
                  ? "Invalid JSON"
                  : verificationPreview.missingConfigKeys.length
                  ? verificationPreview.missingConfigKeys.join(", ")
                  : "None"
              }
            />
          </div>
        </div>
      </div>
      ) : null}

      {currentStep === "launch" ? (
      <>
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Limits
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <ToggleField
            label="Repeatable"
            checked={values.isRepeatable}
            onChange={(checked) =>
              setValues({ ...values, isRepeatable: checked })
            }
          />

          <Field label="Sort Order">
            <input
              type="number"
              min={0}
              value={values.sortOrder}
              onChange={(e) =>
                setValues({ ...values, sortOrder: Number(e.target.value) })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>

          <Field label="Cooldown Seconds">
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
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>

          <Field label="Max Completions Per User">
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
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Timing & Status
        </p>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Starts At">
            <input
              type="datetime-local"
              value={values.startsAt || ""}
              onChange={(e) =>
                setValues({ ...values, startsAt: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>

          <Field label="Ends At">
            <input
              type="datetime-local"
              value={values.endsAt || ""}
              onChange={(e) =>
                setValues({ ...values, endsAt: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
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
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="archived">archived</option>
            </select>
          </Field>
        </div>
      </div>
      </>
      ) : null}

      {submitError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {submitError}
        </div>
      ) : null}

          <BuilderBottomNav
            canGoBack={Boolean(previousStep)}
            onBack={() => previousStep && setCurrentStep(previousStep.id)}
            nextLabel={nextStep ? `Continue to ${nextStep.label}` : undefined}
            onNext={nextStep ? () => setCurrentStep(nextStep.id) : undefined}
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
        </div>

        <BuilderSidebarStack>
          <BuilderSidebarCard title="Quest Preview">
            <QuestPreviewSurface
              preset={activePreset}
              title={values.title || activePreset.label}
              description={
                values.description ||
                values.shortDescription ||
                activePreset.summary
              }
              actionLabel={values.actionLabel}
              xp={values.xp}
              routeLabel={verificationPreview.routeLabel}
              completionMode={values.completionMode}
            />
          </BuilderSidebarCard>

          <BuilderSidebarCard title="Readiness Guide">
            <div className="space-y-2">
              {readinessItems.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-text">{item.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                        item.complete ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {item.complete ? "Ready" : "Needs work"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-sub capitalize">{item.value}</p>
                </div>
              ))}
            </div>
          </BuilderSidebarCard>

          <BuilderSidebarCard title="Verification Routing">
            <div className="space-y-3">
              <RouteInfoCard label="Route" value={verificationPreview.routeLabel} />
              <RouteInfoCard label="Proof expectation" value={verificationPreview.proofExpectation} />
              <RouteInfoCard
                label="Missing keys"
                value={
                  verificationPreview.invalidConfig
                    ? "Invalid JSON"
                    : verificationPreview.missingConfigKeys.length
                      ? verificationPreview.missingConfigKeys.join(", ")
                      : "None"
                }
              />
            </div>
          </BuilderSidebarCard>
        </BuilderSidebarStack>
      </div>
    </form>
  );
}

function RouteInfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm leading-6 text-text">{value}</p>
    </div>
  );
}

function QuestPreviewSurface({
  preset,
  title,
  description,
  actionLabel,
  xp,
  routeLabel,
  completionMode,
}: {
  preset: {
    label: string;
    summary: string;
    platform: string;
    verificationType: string;
    type: string;
  };
  title: string;
  description: string;
  actionLabel: string;
  xp: number;
  routeLabel: string;
  completionMode?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(199,255,0,0.14),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            {preset.label}
          </p>
          <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.03em] text-text">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-sub">{description}</p>
        </div>
        <span className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-3 text-sm font-bold text-text">
          {routeLabel}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
          {preset.type}
        </span>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
          {preset.platform}
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
          {preset.verificationType}
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
          {(completionMode || "manual").replace(/_/g, " ")}
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-text">
          {xp} XP
        </span>
      </div>

      <div className="mt-5 rounded-[20px] border border-white/8 bg-black/20 px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
          User CTA
        </p>
        <p className="mt-2 text-sm font-semibold text-text">{actionLabel || "Open Task"}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold tracking-[-0.01em] text-text">{label}</span>
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
      <span className="text-sm font-semibold text-text">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-lime-400"
      />
    </label>
  );
}
