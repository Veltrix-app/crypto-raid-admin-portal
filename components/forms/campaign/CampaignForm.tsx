"use client";

import { useEffect, useMemo, useState } from "react";
import StudioModeToggle from "@/components/forms/studio/StudioModeToggle";
import StudioReadinessCard from "@/components/forms/studio/StudioReadinessCard";
import type { CampaignStoryboardBlockId } from "@/lib/studio/campaign-storyboard";
import { AdminCampaign } from "@/types/entities/campaign";
import { AdminProject } from "@/types/entities/project";

type Props = {
  projects: AdminProject[];
  initialValues?: Omit<AdminCampaign, "id">;
  defaultProjectId?: string;
  resetKey?: string;
  studioLayout?: "default" | "storyboard";
  focusBlockId?: CampaignStoryboardBlockId | null;
  entrySourceLabel?: string;
  onSubmit: (values: Omit<AdminCampaign, "id">) => void | Promise<void>;
  submitLabel?: string;
};

type CampaignFormErrors = Partial<Record<keyof Omit<AdminCampaign, "id"> | "dateRange", string>>;

function getDefaultCampaignValues(
  projects: AdminProject[],
  defaultProjectId?: string
): Omit<AdminCampaign, "id"> {
  return {
    projectId: defaultProjectId || projects[0]?.id || "",
    title: "",
    slug: "",
    shortDescription: "",
    longDescription: "",
    bannerUrl: "",
    thumbnailUrl: "",
    campaignType: "hybrid",
    campaignMode: "hybrid",
    rewardType: "campaign_pool",
    rewardPoolAmount: 0,
    minXpRequired: 0,
    activityThreshold: 0,
    lockDays: 0,
    xpBudget: 0,
    participants: 0,
    completionRate: 0,
    visibility: "public",
    featured: false,
    startsAt: "",
    endsAt: "",
    status: "draft",
  };
}

const CAMPAIGN_TYPE_PRESETS: Record<
  AdminCampaign["campaignType"],
  {
    label: string;
    summary: string;
    visibility: AdminCampaign["visibility"];
    campaignMode: NonNullable<AdminCampaign["campaignMode"]>;
    rewardType: NonNullable<AdminCampaign["rewardType"]>;
    rewardPoolAmount: number;
    minXpRequired: number;
    activityThreshold: number;
    lockDays: number;
    xpBudget: number;
    featured: boolean;
    shortDescription: string;
  }
> = {
  social_growth: {
    label: "Social Growth Push",
    summary:
      "Use this when the campaign's main job is reach: follows, reposts, comments and traffic into key moments.",
    visibility: "public",
    campaignMode: "offchain",
    rewardType: "campaign_pool",
    rewardPoolAmount: 500,
    minXpRequired: 50,
    activityThreshold: 0,
    lockDays: 7,
    xpBudget: 2500,
    featured: true,
    shortDescription:
      "A high-energy campaign designed to turn attention into measurable social reach.",
  },
  community_growth: {
    label: "Community Expansion",
    summary:
      "Best for campaigns focused on Discord, Telegram and deeper contributor activation.",
    visibility: "public",
    campaignMode: "offchain",
    rewardType: "campaign_pool",
    rewardPoolAmount: 750,
    minXpRequired: 75,
    activityThreshold: 0,
    lockDays: 10,
    xpBudget: 2000,
    featured: false,
    shortDescription:
      "Bring new members into the community and guide them toward their first meaningful actions.",
  },
  onchain: {
    label: "Onchain Activation",
    summary:
      "Built for swaps, mints, wallet connection and asset-based participation loops.",
    visibility: "gated",
    campaignMode: "onchain",
    rewardType: "project_token",
    rewardPoolAmount: 2500,
    minXpRequired: 150,
    activityThreshold: 100,
    lockDays: 14,
    xpBudget: 4000,
    featured: true,
    shortDescription:
      "Drive meaningful onchain participation with wallet-aware tasks and claimable incentives.",
  },
  referral: {
    label: "Referral Loop",
    summary:
      "Use this to turn contributors into acquisition channels with referral quests and invite mechanics.",
    visibility: "public",
    campaignMode: "offchain",
    rewardType: "perk",
    rewardPoolAmount: 600,
    minXpRequired: 60,
    activityThreshold: 0,
    lockDays: 7,
    xpBudget: 3000,
    featured: false,
    shortDescription:
      "Reward contributors for bringing high-intent users into the project ecosystem.",
  },
  content: {
    label: "Content Campaign",
    summary:
      "Great for UGC, writing, design submissions and manual proof-based content loops.",
    visibility: "public",
    campaignMode: "offchain",
    rewardType: "campaign_pool",
    rewardPoolAmount: 450,
    minXpRequired: 40,
    activityThreshold: 0,
    lockDays: 7,
    xpBudget: 1800,
    featured: false,
    shortDescription:
      "Collect quality content and proof-driven contributions around a clear campaign narrative.",
  },
  hybrid: {
    label: "Hybrid Launch",
    summary:
      "Mix social, community and onchain mechanics when you want one central campaign hub.",
    visibility: "public",
    campaignMode: "hybrid",
    rewardType: "mixed",
    rewardPoolAmount: 1500,
    minXpRequired: 100,
    activityThreshold: 50,
    lockDays: 14,
    xpBudget: 3500,
    featured: true,
    shortDescription:
      "A blended campaign structure that combines multiple mechanics into one launch-ready flow.",
  },
};

export default function CampaignForm({
  projects,
  initialValues,
  defaultProjectId,
  resetKey,
  studioLayout = "default",
  focusBlockId = null,
  entrySourceLabel,
  onSubmit,
  submitLabel = "Save Campaign",
}: Props) {
  const [values, setValues] = useState<Omit<AdminCampaign, "id">>(
    initialValues || getDefaultCampaignValues(projects, defaultProjectId)
  );
  const [selectedPreset, setSelectedPreset] = useState<AdminCampaign["campaignType"]>(
    initialValues?.campaignType || "hybrid"
  );
  const [builderMode, setBuilderMode] = useState<"basic" | "advanced">("basic");
  const [errors, setErrors] = useState<CampaignFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const activePreset = CAMPAIGN_TYPE_PRESETS[selectedPreset];
  const isStoryboardLayout = studioLayout === "storyboard";
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === values.projectId),
    [projects, values.projectId]
  );
  const visibleSections = useMemo(() => {
    if (!isStoryboardLayout || !focusBlockId) {
      return {
        blueprint: true,
        essentials: true,
        reward: true,
        copy: true,
        timing: true,
        media: true,
        signals: true,
        questGuidance: false,
        raidGuidance: false,
      };
    }

    switch (focusBlockId) {
      case "goal":
        return {
          blueprint: true,
          essentials: true,
          reward: false,
          copy: true,
          timing: false,
          media: false,
          signals: false,
          questGuidance: false,
          raidGuidance: false,
        };
      case "quest_lane":
        return {
          blueprint: false,
          essentials: true,
          reward: false,
          copy: true,
          timing: false,
          media: false,
          signals: false,
          questGuidance: true,
          raidGuidance: false,
        };
      case "raid_pressure":
        return {
          blueprint: false,
          essentials: false,
          reward: false,
          copy: false,
          timing: true,
          media: false,
          signals: false,
          questGuidance: false,
          raidGuidance: true,
        };
      case "reward_outcome":
        return {
          blueprint: false,
          essentials: false,
          reward: true,
          copy: false,
          timing: false,
          media: false,
          signals: false,
          questGuidance: false,
          raidGuidance: false,
        };
      case "launch_posture":
        return {
          blueprint: false,
          essentials: false,
          reward: false,
          copy: false,
          timing: true,
          media: true,
          signals: true,
          questGuidance: false,
          raidGuidance: false,
        };
      default:
        return {
          blueprint: true,
          essentials: true,
          reward: true,
          copy: true,
          timing: true,
          media: true,
          signals: true,
          questGuidance: false,
          raidGuidance: false,
        };
    }
  }, [focusBlockId, isStoryboardLayout]);

  useEffect(() => {
    if (!values.projectId && defaultProjectId) {
      setValues((current) => ({ ...current, projectId: defaultProjectId }));
    }
  }, [defaultProjectId, values.projectId]);

  useEffect(() => {
    if (!resetKey) return;
    setValues(initialValues || getDefaultCampaignValues(projects, defaultProjectId));
    setSelectedPreset(initialValues?.campaignType || "hybrid");
    setBuilderMode("basic");
    setErrors({});
  }, [defaultProjectId, initialValues, projects, resetKey]);

  useEffect(() => {
    if (!initialValues?.slug && values.title) {
      const nextSlug = values.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      setValues((current) =>
        current.slug === nextSlug || current.slug.trim().length > 0
          ? current
          : { ...current, slug: nextSlug }
      );
    }
  }, [initialValues?.slug, values.title]);

  function applyPreset(campaignType: AdminCampaign["campaignType"]) {
    const preset = CAMPAIGN_TYPE_PRESETS[campaignType];
    setSelectedPreset(campaignType);
    setValues((current) => ({
      ...current,
      campaignType,
      campaignMode: preset.campaignMode,
      rewardType: preset.rewardType,
      rewardPoolAmount:
        typeof current.rewardPoolAmount === "number" &&
        current.rewardPoolAmount > 0 &&
        current.campaignType === campaignType
          ? current.rewardPoolAmount
          : preset.rewardPoolAmount,
      minXpRequired:
        typeof current.minXpRequired === "number" && current.campaignType === campaignType
          ? current.minXpRequired
          : preset.minXpRequired,
      activityThreshold:
        typeof current.activityThreshold === "number" && current.campaignType === campaignType
          ? current.activityThreshold
          : preset.activityThreshold,
      lockDays:
        typeof current.lockDays === "number" && current.campaignType === campaignType
          ? current.lockDays
          : preset.lockDays,
      visibility: preset.visibility,
      xpBudget:
        current.xpBudget > 0 && current.campaignType === campaignType
          ? current.xpBudget
          : preset.xpBudget,
      featured: preset.featured,
      shortDescription:
        current.shortDescription.trim() && current.campaignType === campaignType
          ? current.shortDescription
          : preset.shortDescription,
    }));
  }

  function validate(nextValues: Omit<AdminCampaign, "id">) {
    const nextErrors: CampaignFormErrors = {};

    if (!nextValues.projectId) nextErrors.projectId = "Select a project workspace.";
    if (!nextValues.title.trim()) nextErrors.title = "Campaign title is required.";
    if (!nextValues.slug.trim()) nextErrors.slug = "Slug is required.";
    if (!nextValues.shortDescription.trim()) {
      nextErrors.shortDescription = "Add a short campaign hook.";
    }

    if (nextValues.startsAt && nextValues.endsAt) {
      const start = new Date(nextValues.startsAt).getTime();
      const end = new Date(nextValues.endsAt).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
        nextErrors.dateRange = "End time cannot be earlier than the start time.";
      }
    }

    return nextErrors;
  }

  function updateField<K extends keyof Omit<AdminCampaign, "id">>(
    key: K,
    value: Omit<AdminCampaign, "id">[K]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key] && !(key === "startsAt" || key === "endsAt" || current.dateRange)) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      if (key === "startsAt" || key === "endsAt") {
        delete next.dateRange;
      }
      return next;
    });
  }

  const readinessItems = [
    {
      label: "Workspace",
      value: selectedProject ? `${selectedProject.name} is selected` : "Select a project workspace",
      complete: Boolean(selectedProject),
    },
    {
      label: "Campaign hook",
      value: values.shortDescription.trim()
        ? "Short description is ready for launch surfaces"
        : "Add a short campaign hook for contributors",
      complete: Boolean(values.shortDescription.trim()),
    },
    {
      label: "Reward posture",
      value:
        (values.rewardPoolAmount ?? 0) > 0 || (values.xpBudget ?? 0) > 0
          ? "Reward budget is defined"
          : "Set reward pool or XP budget before launch",
      complete: (values.rewardPoolAmount ?? 0) > 0 || (values.xpBudget ?? 0) > 0,
    },
  ];

  return (
    <form
              className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const nextErrors = validate(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        setSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {Object.keys(errors).length > 0 ? (
        <div className="rounded-[18px] border border-rose-500/30 bg-rose-500/[0.055] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">
            Missing required campaign fields
          </p>
          <div className="mt-3 space-y-2 text-sm text-rose-100">
            {Object.values(errors).map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        </div>
      ) : null}

        {isStoryboardLayout ? (
          <div className="rounded-[18px] border border-white/[0.032] bg-white/[0.018] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Focused launch controls
              </p>
              <p className="mt-2 text-sm leading-6 text-sub">
                This launch editor only shows the campaign controls that belong to the currently
                selected storyboard block. Switch blocks in the storyboard when you want to tune
                a different part of the journey.
              </p>
            </div>
            <span className="rounded-full border border-white/[0.032] bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text">
              {focusBlockId?.replace(/_/g, " ") ?? "full editor"}
            </span>
            </div>
          </div>
        ) : null}

        {entrySourceLabel ? (
          <div className="rounded-[18px] border border-primary/20 bg-primary/[0.055] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Launch handoff
                </p>
                <p className="mt-2 text-sm leading-6 text-primary">
                  This campaign entered through <span className="font-semibold text-white">{entrySourceLabel}</span>. Keep the launch posture, starter fit and downstream quest lane aligned while you shape the storyboard.
                </p>
              </div>
              <span className="rounded-full border border-primary/25 bg-primary/[0.065] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                project-first
              </span>
            </div>
          </div>
        ) : null}

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

      {!isStoryboardLayout ? (
        <StudioReadinessCard title="Campaign readiness" items={readinessItems} />
      ) : null}

      {visibleSections.blueprint ? (
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Campaign Blueprint
        </p>

        <div className="grid gap-3 xl:grid-cols-2">
          {(
            ["hybrid", "social_growth", "community_growth", "onchain", "referral", "content"] as AdminCampaign["campaignType"][]
          ).map((campaignType) => {
            const preset = CAMPAIGN_TYPE_PRESETS[campaignType];
            const isActive = values.campaignType === campaignType;

            return (
              <button
                key={campaignType}
                type="button"
                onClick={() => applyPreset(campaignType)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? "border-primary bg-primary/[0.055]"
                    : "border-white/[0.028] bg-white/[0.014] hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-bold text-text">{preset.label}</p>
                <p className="mt-2 text-sm leading-6 text-sub">{preset.summary}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/[0.028] bg-white/[0.014] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">{activePreset.label}</p>
              <p className="mt-2 text-sm leading-6 text-sub">{activePreset.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
              <span className="rounded-full bg-primary/[0.075] px-3 py-1 text-primary">
                {values.campaignType.replace(/_/g, " ")}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-text">
                {activePreset.visibility}
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-text">
                {activePreset.xpBudget} xp
              </span>
            </div>
          </div>
        </div>
      </div>
      ) : null}

      {visibleSections.questGuidance ? (
        <div className="rounded-[18px] border border-white/[0.032] bg-white/[0.018] p-4 text-sm leading-6 text-sub">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
            Quest lane handoff
          </p>
          <p className="mt-3">
            The quest lane itself gets refined in the generated journey drafts. Use this launch
            block to keep the campaign title, slug and member-facing hook aligned with the quest
            path you already designed in the storyboard.
          </p>
        </div>
      ) : null}

      {visibleSections.essentials ? (
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Campaign Essentials
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Project" required error={errors.projectId}>
            <select
              value={values.projectId}
              onChange={(e) => updateField("projectId", e.target.value)}
              className={getInputClassName(Boolean(errors.projectId))}
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

          <Field label="Campaign Title" required error={errors.title}>
            <input
              value={values.title}
              onChange={(e) => updateField("title", e.target.value)}
              className={getInputClassName(Boolean(errors.title))}
              required
            />
          </Field>

          <Field label="Slug" required error={errors.slug}>
            <input
              value={values.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              className={getInputClassName(Boolean(errors.slug))}
              placeholder="weekly-meme-push"
              required
            />
          </Field>

          <Field label="Visibility">
            <select
              value={values.visibility}
              onChange={(e) =>
                updateField("visibility", e.target.value as AdminCampaign["visibility"])
              }
              className={getInputClassName(false)}
            >
              <option value="public">public</option>
              <option value="private">private</option>
              <option value="gated">gated</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              value={values.status}
              onChange={(e) =>
                updateField("status", e.target.value as AdminCampaign["status"])
              }
              className={getInputClassName(false)}
            >
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="completed">completed</option>
              <option value="archived">archived</option>
            </select>
          </Field>
        </div>

        {selectedProject ? (
          <p className="text-sm text-sub">
            This campaign will launch inside{" "}
            <span className="font-semibold text-text">{selectedProject.name}</span>
            {values.visibility === "gated"
              ? " with gated visibility, which is a good fit for wallet-aware or staged rollout flows."
              : " and will be visible as a standard discoverable campaign unless you change visibility."}
          </p>
        ) : null}
      </div>
      ) : null}

      {visibleSections.reward ? (
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Reward And Access
        </p>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Reward Pool Amount">
            <input
              type="number"
              min={0}
              value={values.rewardPoolAmount ?? 0}
              onChange={(e) => updateField("rewardPoolAmount", Number(e.target.value))}
              className={getInputClassName(false)}
            />
          </Field>

          <Field label="Minimum Active XP">
            <input
              type="number"
              min={0}
              value={values.minXpRequired ?? 0}
              onChange={(e) => updateField("minXpRequired", Number(e.target.value))}
              className={getInputClassName(false)}
            />
          </Field>

          <Field label="XP Budget">
            <input
              type="number"
              min={0}
              value={values.xpBudget}
              onChange={(e) => updateField("xpBudget", Number(e.target.value))}
              className={getInputClassName(false)}
            />
          </Field>

          {builderMode === "advanced" ? (
            <>
              <Field label="Campaign Mode">
                <select
                  value={values.campaignMode ?? "offchain"}
                  onChange={(e) =>
                    updateField(
                      "campaignMode",
                      e.target.value as NonNullable<AdminCampaign["campaignMode"]>
                    )
                  }
                  className={getInputClassName(false)}
                >
                  <option value="offchain">offchain</option>
                  <option value="onchain">onchain</option>
                  <option value="hybrid">hybrid</option>
                </select>
              </Field>

              <Field label="Reward Type">
                <select
                  value={values.rewardType ?? "campaign_pool"}
                  onChange={(e) =>
                    updateField(
                      "rewardType",
                      e.target.value as NonNullable<AdminCampaign["rewardType"]>
                    )
                  }
                  className={getInputClassName(false)}
                >
                  <option value="campaign_pool">campaign_pool</option>
                  <option value="usdc">usdc</option>
                  <option value="project_token">project_token</option>
                  <option value="nft">nft</option>
                  <option value="perk">perk</option>
                  <option value="mixed">mixed</option>
                </select>
              </Field>

              <Field label="Activity Threshold">
                <input
                  type="number"
                  min={0}
                  value={values.activityThreshold ?? 0}
                  onChange={(e) => updateField("activityThreshold", Number(e.target.value))}
                  className={getInputClassName(false)}
                />
              </Field>

              <Field label="Lock Days">
                <input
                  type="number"
                  min={0}
                  value={values.lockDays ?? 0}
                  onChange={(e) => updateField("lockDays", Number(e.target.value))}
                  className={getInputClassName(false)}
                />
              </Field>
            </>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/[0.028] bg-white/[0.014] p-4 text-sm text-sub">
          <span className="font-semibold text-text">AESP hint:</span> reward pool, minimum active XP and lock window now drive the first staking and distribution tranche. Keep the values conservative until you see real campaign flow.
        </div>
      </div>
      ) : null}

      {visibleSections.copy ? (
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Member Facing Copy
        </p>

        <Field label="Short Description" required error={errors.shortDescription}>
          <textarea
            value={values.shortDescription}
            onChange={(e) => updateField("shortDescription", e.target.value)}
            rows={4}
            className={getInputClassName(Boolean(errors.shortDescription))}
            required
          />
        </Field>

        <Field label="Long Description">
          <textarea
            value={values.longDescription || ""}
            onChange={(e) => updateField("longDescription", e.target.value)}
            rows={8}
            className={getInputClassName(false)}
          />
        </Field>

        <div className="rounded-2xl border border-white/[0.028] bg-white/[0.014] p-4 text-sm text-sub">
          <span className="font-semibold text-text">Builder hint:</span> write the short description like the campaign hook contributors see first, and use the long description to explain the full loop, reward logic and what success looks like.
        </div>
      </div>
      ) : null}

      {visibleSections.raidGuidance ? (
        <div className="rounded-[18px] border border-amber-400/20 bg-amber-500/[0.06] p-4 text-sm leading-6 text-amber-100">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
            Raid posture
          </p>
          <p className="mt-3">
            Raids work best as a momentum spike layered on top of a stable quest lane. Use the
            timing controls below to decide when this campaign becomes visible and whether it is
            strong enough to support a live pressure wave.
          </p>
        </div>
      ) : null}

      {visibleSections.timing ? (
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Timing And Launch
        </p>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Starts At" error={errors.dateRange}>
            <input
              type="datetime-local"
              value={values.startsAt || ""}
              onChange={(e) => updateField("startsAt", e.target.value)}
              className={getInputClassName(Boolean(errors.dateRange))}
            />
          </Field>

          <Field label="Ends At" error={errors.dateRange}>
            <input
              type="datetime-local"
              value={values.endsAt || ""}
              onChange={(e) => updateField("endsAt", e.target.value)}
              className={getInputClassName(Boolean(errors.dateRange))}
            />
          </Field>

          <div className="space-y-2">
            <span className="block text-sm font-semibold text-text">Featured Campaign</span>
            <ToggleField
              label="Show this campaign more prominently"
              checked={values.featured}
              onChange={(checked) => setValues({ ...values, featured: checked })}
            />
          </div>
        </div>
      </div>
      ) : null}

      {builderMode === "advanced" && visibleSections.media ? (
        <>
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
              Media
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Banner URL">
                <input
                  value={values.bannerUrl || ""}
                  onChange={(e) => updateField("bannerUrl", e.target.value)}
                  className={getInputClassName(false)}
                  placeholder="https://..."
                />
              </Field>

              <Field label="Thumbnail URL">
                <input
                  value={values.thumbnailUrl || ""}
                  onChange={(e) => updateField("thumbnailUrl", e.target.value)}
                  className={getInputClassName(false)}
                  placeholder="https://..."
                />
              </Field>
            </div>
          </div>

          {visibleSections.signals ? (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
              Advanced Signals
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Participants">
                <input
                  type="number"
                  min={0}
                  value={values.participants}
                  onChange={(e) => updateField("participants", Number(e.target.value))}
                  className={getInputClassName(false)}
                />
              </Field>

              <Field label="Completion Rate">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={values.completionRate}
                  onChange={(e) => updateField("completionRate", Number(e.target.value))}
                  className={getInputClassName(false)}
                />
              </Field>
            </div>
          </div>
          ) : null}
        </>
      ) : null}

      <button
        disabled={submitting}
        className="rounded-2xl bg-primary px-5 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-text">
        {label}
        {required ? <span className="ml-1 text-rose-300">*</span> : null}
      </span>
      {children}
      {error ? <span className="mt-2 block text-sm text-rose-200">{error}</span> : null}
    </label>
  );
}

function getInputClassName(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 outline-none ${
    hasError
      ? "border-rose-400/60 bg-rose-500/[0.055] text-text"
      : "border-white/[0.028] bg-white/[0.014]"
  }`;
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
    <label className="flex items-center justify-between rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-4">
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
