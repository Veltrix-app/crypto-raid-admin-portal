"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminCampaign } from "@/types/entities/campaign";
import { AdminProject } from "@/types/entities/project";

type Props = {
  projects: AdminProject[];
  initialValues?: Omit<AdminCampaign, "id">;
  defaultProjectId?: string;
  resetKey?: string;
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
    xpBudget: number;
    featured: boolean;
    shortDescription: string;
  }
> = {
  social_growth: {
    label: "Social Growth Push",
    summary: "Use this when the campaign’s main job is reach: follows, reposts, comments and traffic into key moments.",
    visibility: "public",
    xpBudget: 2500,
    featured: true,
    shortDescription: "A high-energy campaign designed to turn attention into measurable social reach.",
  },
  community_growth: {
    label: "Community Expansion",
    summary: "Best for campaigns focused on Discord, Telegram and deeper contributor activation.",
    visibility: "public",
    xpBudget: 2000,
    featured: false,
    shortDescription: "Bring new members into the community and guide them toward their first meaningful actions.",
  },
  onchain: {
    label: "Onchain Activation",
    summary: "Built for swaps, mints, wallet connection and asset-based participation loops.",
    visibility: "gated",
    xpBudget: 4000,
    featured: true,
    shortDescription: "Drive meaningful onchain participation with wallet-aware tasks and claimable incentives.",
  },
  referral: {
    label: "Referral Loop",
    summary: "Use this to turn contributors into acquisition channels with referral quests and invite mechanics.",
    visibility: "public",
    xpBudget: 3000,
    featured: false,
    shortDescription: "Reward contributors for bringing high-intent users into the project ecosystem.",
  },
  content: {
    label: "Content Campaign",
    summary: "Great for UGC, writing, design submissions and manual proof-based content loops.",
    visibility: "public",
    xpBudget: 1800,
    featured: false,
    shortDescription: "Collect quality content and proof-driven contributions around a clear campaign narrative.",
  },
  hybrid: {
    label: "Hybrid Launch",
    summary: "Mix social, community and onchain mechanics when you want one central campaign hub.",
    visibility: "public",
    xpBudget: 3500,
    featured: true,
    shortDescription: "A blended campaign structure that combines multiple mechanics into one launch-ready flow.",
  },
};

export default function CampaignForm({
  projects,
  initialValues,
  defaultProjectId,
  resetKey,
  onSubmit,
  submitLabel = "Save Campaign",
}: Props) {
  const [values, setValues] = useState<Omit<AdminCampaign, "id">>(
    initialValues || getDefaultCampaignValues(projects, defaultProjectId)
  );
  const [selectedPreset, setSelectedPreset] = useState<AdminCampaign["campaignType"]>(
    initialValues?.campaignType || "hybrid"
  );
  const [errors, setErrors] = useState<CampaignFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const activePreset = CAMPAIGN_TYPE_PRESETS[selectedPreset];
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === values.projectId),
    [projects, values.projectId]
  );

  useEffect(() => {
    if (!values.projectId && defaultProjectId) {
      setValues((current) => ({ ...current, projectId: defaultProjectId }));
    }
  }, [defaultProjectId, values.projectId]);

  useEffect(() => {
    if (!resetKey) return;
    setValues(initialValues || getDefaultCampaignValues(projects, defaultProjectId));
    setSelectedPreset(initialValues?.campaignType || "hybrid");
    setErrors({});
  }, [defaultProjectId, projects, resetKey]);

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
      visibility: preset.visibility,
      xpBudget: current.xpBudget > 0 && current.campaignType === campaignType ? current.xpBudget : preset.xpBudget,
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

  return (
    <form
      className="space-y-8"
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
        <div className="rounded-[24px] border border-rose-500/30 bg-rose-500/10 p-4">
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
                    ? "border-primary bg-primary/10"
                    : "border-line bg-card2 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-bold text-text">{preset.label}</p>
                <p className="mt-2 text-sm leading-6 text-sub">{preset.summary}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-line bg-card2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">{activePreset.label}</p>
              <p className="mt-2 text-sm leading-6 text-sub">{activePreset.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">{values.campaignType.replace(/_/g, " ")}</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-text">{activePreset.visibility}</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-text">{activePreset.xpBudget} xp</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          General
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

          <Field label="Campaign Type">
            <select
              value={values.campaignType}
              onChange={(e) =>
                applyPreset(e.target.value as AdminCampaign["campaignType"])
              }
              className={getInputClassName(false)}
            >
              <option value="social_growth">social_growth</option>
              <option value="community_growth">community_growth</option>
              <option value="onchain">onchain</option>
              <option value="referral">referral</option>
              <option value="content">content</option>
              <option value="hybrid">hybrid</option>
            </select>
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
            This campaign will launch inside <span className="font-semibold text-text">{selectedProject.name}</span>
            {values.visibility === "gated"
              ? " with gated visibility, which is a good fit for wallet-aware or staged rollout flows."
              : " and will be visible as a standard discoverable campaign unless you change visibility."}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Content
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

        <div className="rounded-2xl border border-line bg-card2 p-4 text-sm text-sub">
          <span className="font-semibold text-text">Builder hint:</span> write the short description like the campaign hook contributors see first, and use the long description to explain the full loop, reward logic and what “success” looks like.
        </div>
      </div>

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

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Campaign Settings
        </p>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="XP Budget">
            <input
              type="number"
              min={0}
              value={values.xpBudget}
              onChange={(e) => updateField("xpBudget", Number(e.target.value))}
              className={getInputClassName(false)}
            />
          </Field>

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

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Timing
        </p>

        <div className="grid gap-5 md:grid-cols-2">
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
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Visibility
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <ToggleField
            label="Featured Campaign"
            checked={values.featured}
            onChange={(checked) =>
              setValues({ ...values, featured: checked })
            }
          />
        </div>
      </div>

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
      ? "border-rose-400/60 bg-rose-500/10 text-text"
      : "border-line bg-card2"
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
    <label className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-4">
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
