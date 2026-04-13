"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminProject } from "@/types/entities/project";

type Props = {
  initialValues?: Omit<AdminProject, "id">;
  onSubmit: (values: Omit<AdminProject, "id">) => void;
  submitLabel?: string;
};

type StepId =
  | "identity"
  | "brand"
  | "links"
  | "context"
  | "public-profile"
  | "review";

const defaultValues: Omit<AdminProject, "id"> = {
  name: "",
  slug: "",
  chain: "Base",
  category: "",
  status: "draft",
  onboardingStatus: "draft",
  description: "",
  longDescription: "",
  members: 0,
  campaigns: 0,
  logo: "\uD83D\uDE80",
  bannerUrl: "",
  website: "",
  xUrl: "",
  telegramUrl: "",
  discordUrl: "",
  docsUrl: "",
  waitlistUrl: "",
  launchPostUrl: "",
  tokenContractAddress: "",
  nftContractAddress: "",
  primaryWallet: "",
  brandAccent: "",
  brandMood: "",
  contactEmail: "",
  isFeatured: false,
  isPublic: true,
};

const steps: Array<{
  id: StepId;
  label: string;
  eyebrow: string;
  description: string;
}> = [
  {
    id: "identity",
    label: "Identity",
    eyebrow: "Step 1",
    description: "Name the workspace and lock in the core metadata.",
  },
  {
    id: "brand",
    label: "Brand",
    eyebrow: "Step 2",
    description: "Set the tone and public-facing assets.",
  },
  {
    id: "links",
    label: "Links",
    eyebrow: "Step 3",
    description: "Connect the channels templates can use automatically.",
  },
  {
    id: "context",
    label: "Campaign Context",
    eyebrow: "Step 4",
    description: "Add launch, contract, and wallet context for smarter automation.",
  },
  {
    id: "public-profile",
    label: "Public Profile",
    eyebrow: "Step 5",
    description: "Refine the story, metrics, and visibility settings users will see.",
  },
  {
    id: "review",
    label: "Review",
    eyebrow: "Step 6",
    description: "Check readiness before saving the workspace.",
  },
];

export default function ProjectForm({
  initialValues,
  onSubmit,
  submitLabel = "Save Project",
}: Props) {
  const [values, setValues] = useState<Omit<AdminProject, "id">>(initialValues || defaultValues);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [currentStep, setCurrentStep] = useState<StepId>("identity");

  useEffect(() => {
    setValues(initialValues || defaultValues);
    setSlugTouched(Boolean(initialValues?.slug));
  }, [initialValues]);

  useEffect(() => {
    if (slugTouched) return;
    setValues((current) => ({ ...current, slug: slugify(current.name) }));
  }, [slugTouched, values.name]);

  const connectedLinks = useMemo(
    () =>
      [
        values.website,
        values.xUrl,
        values.telegramUrl,
        values.discordUrl,
        values.docsUrl,
        values.waitlistUrl,
      ].filter(Boolean).length,
    [
      values.discordUrl,
      values.docsUrl,
      values.telegramUrl,
      values.waitlistUrl,
      values.website,
      values.xUrl,
    ]
  );

  const templateContextCount = useMemo(
    () =>
      [
        values.docsUrl,
        values.waitlistUrl,
        values.launchPostUrl,
        values.tokenContractAddress,
        values.nftContractAddress,
        values.primaryWallet,
        values.brandAccent,
        values.brandMood,
      ].filter(Boolean).length,
    [
      values.brandAccent,
      values.brandMood,
      values.docsUrl,
      values.launchPostUrl,
      values.nftContractAddress,
      values.primaryWallet,
      values.tokenContractAddress,
      values.waitlistUrl,
    ]
  );

  const brandingReadiness = [
    {
      label: "Identity",
      value: values.logo && values.name ? "Ready" : "Missing logo or project name",
      complete: Boolean(values.logo && values.name),
    },
    {
      label: "Public copy",
      value: values.description ? "Short profile added" : "Add a short public description",
      complete: Boolean(values.description),
    },
    {
      label: "Distribution links",
      value: connectedLinks > 0 ? `${connectedLinks} channels connected` : "No channels linked yet",
      complete: connectedLinks > 0,
    },
    {
      label: "Campaign context",
      value:
        values.launchPostUrl || values.docsUrl || values.waitlistUrl
          ? "Template autofill context is expanding"
          : "Add docs, waitlist or launch links for richer templates",
      complete: Boolean(values.launchPostUrl || values.docsUrl || values.waitlistUrl),
    },
    {
      label: "Visibility",
      value: values.isPublic ? "Workspace can appear publicly" : "Workspace remains private",
      complete: true,
    },
  ];

  const stepCompletion: Record<StepId, boolean> = {
    identity: Boolean(values.name && values.slug && values.chain),
    brand: Boolean(values.logo && (values.bannerUrl || values.brandAccent || values.brandMood)),
    links: connectedLinks > 0,
    context: templateContextCount > 0,
    "public-profile": Boolean(values.description && values.contactEmail),
    review: brandingReadiness.filter((item) => item.complete).length >= 4,
  };

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const currentStepMeta = steps[currentStepIndex];
  const previousStep = steps[currentStepIndex - 1];
  const nextStep = steps[currentStepIndex + 1];
  const readinessCount = brandingReadiness.filter((item) => item.complete).length;

  const setField = <K extends keyof Omit<AdminProject, "id">>(
    key: K,
    value: Omit<AdminProject, "id">[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="rounded-[32px] border border-line bg-card p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Project Setup Wizard
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-text">
              Build the workspace through a guided walkthrough
            </h2>
            <p className="mt-3 text-sm leading-6 text-sub">
              Move through identity, brand, links, and campaign context step by step. The
              public preview and readiness stay visible while you work.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricTile label="Readiness" value={`${readinessCount}/${brandingReadiness.length}`} sublabel="sections ready" />
            <MetricTile label="Connected Links" value={String(connectedLinks)} sublabel="channels" />
            <MetricTile label="Template Context" value={String(templateContextCount)} sublabel="advanced fields" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.4fr_0.9fr]">
        <aside className="rounded-[28px] border border-line bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Progress</p>
          <div className="mt-4 space-y-3">
            {steps.map((step, index) => {
              const active = step.id === currentStep;
              const complete = stepCompletion[step.id];
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                    active
                      ? "border-primary/50 bg-primary/10"
                      : "border-line bg-card2 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
                        {step.eyebrow}
                      </p>
                      <p className="mt-2 text-sm font-bold text-text">
                        {index + 1}. {step.label}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                        complete ? "bg-primary/15 text-primary" : active ? "bg-card text-text" : "bg-card text-sub"
                      }`}
                    >
                      {complete ? "Ready" : active ? "Current" : "Open"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-sub">{step.description}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-6 rounded-[28px] border border-line bg-card p-6">
          <div className="flex flex-col gap-3 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {currentStepMeta.eyebrow}
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-text">{currentStepMeta.label}</h3>
              <p className="mt-2 text-sm leading-6 text-sub">{currentStepMeta.description}</p>
            </div>
            <div className="rounded-2xl border border-line bg-card2 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Workflow</p>
              <p className="mt-2 text-sm font-semibold text-text">
                {currentStepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>

          {currentStep === "identity" ? renderIdentity(values, setField, setSlugTouched) : null}
          {currentStep === "brand" ? renderBrand(values, setField) : null}
          {currentStep === "links" ? renderLinks(values, setField) : null}
          {currentStep === "context" ? renderContext(values, setField) : null}
          {currentStep === "public-profile" ? renderPublicProfile(values, setField) : null}
          {currentStep === "review" ? renderReview(values, brandingReadiness, connectedLinks, templateContextCount) : null}

          <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => previousStep && setCurrentStep(previousStep.id)}
                disabled={!previousStep}
                className="rounded-2xl border border-line bg-card2 px-5 py-3 font-bold text-text disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>

              {nextStep ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(nextStep.id)}
                  className="rounded-2xl bg-primary px-5 py-3 font-bold text-black"
                >
                  Continue
                </button>
              ) : (
                <button className="rounded-2xl bg-primary px-5 py-3 font-bold text-black">
                  {submitLabel}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => onSubmit(values)}
              className="rounded-2xl border border-line bg-card2 px-5 py-3 text-sm font-bold text-text"
            >
              Save Draft Now
            </button>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="overflow-hidden rounded-[28px] border border-line bg-card">
            <div
              className="h-36 bg-gradient-to-br from-primary/15 via-card to-card2"
              style={
                values.brandAccent
                  ? {
                      backgroundImage: `linear-gradient(135deg, ${values.brandAccent}22, rgba(10,12,18,0.88), rgba(18,22,32,0.98))`,
                    }
                  : undefined
              }
            >
              {values.bannerUrl ? (
                <img
                  src={values.bannerUrl}
                  alt={`${values.name || "Project"} banner`}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-card2 text-2xl">
                  {values.logo || "\uD83D\uDE80"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-text">
                    {values.name || "Project name"}
                  </p>
                  <p className="truncate text-sm text-sub">/{values.slug || "project-slug"}</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-sub">
                {values.description || "Short public description will appear here."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <PreviewBadge>{values.chain}</PreviewBadge>
                {values.category ? <PreviewBadge>{values.category}</PreviewBadge> : null}
                <PreviewBadge>{values.isPublic ? "Public" : "Private"}</PreviewBadge>
                {values.brandMood ? <PreviewBadge>{values.brandMood}</PreviewBadge> : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <PreviewStat label="Members" value={String(values.members)} />
                <PreviewStat label="Campaigns" value={String(values.campaigns)} />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Readiness Guide
            </p>
            <div className="mt-4 space-y-3">
              {brandingReadiness.map((item) => (
                <div key={item.label} className="rounded-2xl border border-line bg-card2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-text">{item.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                        item.complete ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {item.complete ? "Ready" : "Missing"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-sub">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Autofill Signals
            </p>
            <div className="mt-4 grid gap-3">
              <SignalRow label="Website" ready={Boolean(values.website)} />
              <SignalRow label="X" ready={Boolean(values.xUrl)} />
              <SignalRow label="Telegram" ready={Boolean(values.telegramUrl)} />
              <SignalRow label="Discord" ready={Boolean(values.discordUrl)} />
              <SignalRow label="Docs" ready={Boolean(values.docsUrl)} />
              <SignalRow label="Waitlist" ready={Boolean(values.waitlistUrl)} />
              <SignalRow label="Launch Post" ready={Boolean(values.launchPostUrl)} />
              <SignalRow label="Token Contract" ready={Boolean(values.tokenContractAddress)} />
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}

function renderIdentity(
  values: Omit<AdminProject, "id">,
  setField: <K extends keyof Omit<AdminProject, "id">>(
    key: K,
    value: Omit<AdminProject, "id">[K]
  ) => void,
  setSlugTouched: (value: boolean) => void
) {
  return (
    <div className="space-y-6">
      <SectionIntro
        title="Anchor the workspace basics"
        body="These fields shape project pages, template names, and how the workspace appears across the portal and app."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Project Name">
          <input
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            required
          />
        </Field>

        <Field label="Slug">
          <input
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setField("slug", e.target.value);
            }}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="pepe-raiders"
            required
          />
        </Field>

        <Field label="Chain">
          <select
            value={values.chain}
            onChange={(e) => setField("chain", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            <option>Base</option>
            <option>Ethereum</option>
            <option>Solana</option>
            <option>BNB Chain</option>
            <option>Arbitrum</option>
            <option>Other</option>
          </select>
        </Field>

        <Field label="Category">
          <input
            value={values.category || ""}
            onChange={(e) => setField("category", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="Meme, DeFi, NFT, Gaming..."
          />
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(e) => setField("status", e.target.value as AdminProject["status"])}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
          </select>
        </Field>

        <Field label="Onboarding Status">
          <select
            value={values.onboardingStatus}
            onChange={(e) =>
              setField("onboardingStatus", e.target.value as AdminProject["onboardingStatus"])
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            <option value="draft">draft</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

function renderBrand(
  values: Omit<AdminProject, "id">,
  setField: <K extends keyof Omit<AdminProject, "id">>(
    key: K,
    value: Omit<AdminProject, "id">[K]
  ) => void
) {
  return (
    <div className="space-y-6">
      <SectionIntro
        title="Define the mood and public surface"
        body="Set the hero assets and emotional tone once, then let project pages and templates inherit that identity."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Logo / Emoji">
          <input
            value={values.logo}
            onChange={(e) => setField("logo", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="Rocket, monogram, or logo hint"
          />
        </Field>

        <Field label="Banner URL">
          <input
            value={values.bannerUrl || ""}
            onChange={(e) => setField("bannerUrl", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="https://..."
          />
        </Field>

        <Field label="Contact Email">
          <input
            type="email"
            value={values.contactEmail || ""}
            onChange={(e) => setField("contactEmail", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="team@project.com"
          />
        </Field>

        <Field label="Brand Accent">
          <input
            value={values.brandAccent || ""}
            onChange={(e) => setField("brandAccent", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="#C7FF00"
          />
        </Field>

        <Field label="Brand Mood">
          <input
            value={values.brandMood || ""}
            onChange={(e) => setField("brandMood", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="Launch, premium, playful..."
          />
        </Field>
      </div>
    </div>
  );
}

function renderLinks(
  values: Omit<AdminProject, "id">,
  setField: <K extends keyof Omit<AdminProject, "id">>(
    key: K,
    value: Omit<AdminProject, "id">[K]
  ) => void
) {
  return (
    <div className="space-y-6">
      <SectionIntro
        title="Connect the channels templates depend on"
        body="The more destination links you connect here, the less your team needs to type when generating campaigns and quests."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Website">
          <input
            value={values.website || ""}
            onChange={(e) => setField("website", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="https://..."
          />
        </Field>

        <Field label="X URL">
          <input
            value={values.xUrl || ""}
            onChange={(e) => setField("xUrl", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="https://x.com/..."
          />
        </Field>

        <Field label="Telegram URL">
          <input
            value={values.telegramUrl || ""}
            onChange={(e) => setField("telegramUrl", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="https://t.me/..."
          />
        </Field>

        <Field label="Discord URL">
          <input
            value={values.discordUrl || ""}
            onChange={(e) => setField("discordUrl", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="https://discord.gg/..."
          />
        </Field>

        <Field label="Docs URL">
          <input
            value={values.docsUrl || ""}
            onChange={(e) => setField("docsUrl", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="https://docs..."
          />
        </Field>

        <Field label="Waitlist URL">
          <input
            value={values.waitlistUrl || ""}
            onChange={(e) => setField("waitlistUrl", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="https://..."
          />
        </Field>
      </div>
    </div>
  );
}

function renderContext(
  values: Omit<AdminProject, "id">,
  setField: <K extends keyof Omit<AdminProject, "id">>(
    key: K,
    value: Omit<AdminProject, "id">[K]
  ) => void
) {
  return (
    <div className="space-y-6">
      <SectionIntro
        title="Feed the automation layer"
        body="Launch, contract, and wallet context unlock better holder flows, creator loops, launch templates, and future automation."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Launch Post URL">
          <input
            value={values.launchPostUrl || ""}
            onChange={(e) => setField("launchPostUrl", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="https://x.com/.../status/..."
          />
        </Field>

        <Field label="Token Contract">
          <input
            value={values.tokenContractAddress || ""}
            onChange={(e) => setField("tokenContractAddress", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="0x..."
          />
        </Field>

        <Field label="NFT Contract">
          <input
            value={values.nftContractAddress || ""}
            onChange={(e) => setField("nftContractAddress", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="0x..."
          />
        </Field>

        <Field label="Primary Wallet">
          <input
            value={values.primaryWallet || ""}
            onChange={(e) => setField("primaryWallet", e.target.value)}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="0x..."
          />
        </Field>
      </div>
    </div>
  );
}

function renderPublicProfile(
  values: Omit<AdminProject, "id">,
  setField: <K extends keyof Omit<AdminProject, "id">>(
    key: K,
    value: Omit<AdminProject, "id">[K]
  ) => void
) {
  return (
    <div className="space-y-6">
      <SectionIntro
        title="Shape the story users will actually read"
        body="This is the copy and context your users feel first in the app, public project pages, and template previews."
      />

      <Field label="Description">
        <textarea
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={5}
          className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          placeholder="Short project description..."
        />
      </Field>

      <Field label="Long Description">
        <textarea
          value={values.longDescription || ""}
          onChange={(e) => setField("longDescription", e.target.value)}
          rows={8}
          className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          placeholder="Longer project overview, mission, value proposition..."
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Members">
          <input
            type="number"
            value={values.members}
            onChange={(e) => setField("members", Number(e.target.value))}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            min={0}
          />
        </Field>

        <Field label="Campaign Count">
          <input
            type="number"
            value={values.campaigns}
            onChange={(e) => setField("campaigns", Number(e.target.value))}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            min={0}
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <ToggleField
          label="Featured Project"
          checked={values.isFeatured || false}
          onChange={(checked) => setField("isFeatured", checked)}
        />

        <ToggleField
          label="Public Project"
          checked={values.isPublic ?? true}
          onChange={(checked) => setField("isPublic", checked)}
        />
      </div>
    </div>
  );
}

function renderReview(
  values: Omit<AdminProject, "id">,
  brandingReadiness: Array<{ label: string; value: string; complete: boolean }>,
  connectedLinks: number,
  templateContextCount: number
) {
  return (
    <div className="space-y-6">
      <SectionIntro
        title="Review the workspace before you save it"
        body="This final pass is meant to feel like a preflight: what is ready, what is still thin, and what will strengthen templates instantly."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {brandingReadiness.map((item) => (
          <div key={item.label} className="rounded-[22px] border border-line bg-card2 p-4">
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
            <p className="mt-3 text-sm text-sub">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryPanel
          title="Workspace Snapshot"
          items={[
            ["Name", values.name || "Missing"],
            ["Slug", values.slug || "Missing"],
            ["Chain", values.chain || "Missing"],
            ["Category", values.category || "Not set"],
            ["Contact", values.contactEmail || "Missing"],
          ]}
        />
        <SummaryPanel
          title="Template Readiness"
          items={[
            ["Connected Links", `${connectedLinks}`],
            ["Advanced Context", `${templateContextCount}`],
            ["Public Visibility", values.isPublic ? "Enabled" : "Private"],
            ["Status", values.status],
            ["Onboarding", values.onboardingStatus],
          ]}
        />
      </div>
    </div>
  );
}

function SectionIntro({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-line bg-card2 p-5">
      <p className="text-lg font-extrabold text-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{body}</p>
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
      <span className="mb-2 block text-sm font-semibold text-text">{label}</span>
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

function PreviewBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-card2 px-3 py-1 text-xs font-bold text-text">
      {children}
    </span>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card2 px-4 py-4">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-xl font-extrabold text-text">{value}</p>
    </div>
  );
}

function MetricTile({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-text">{value}</p>
      <p className="mt-1 text-xs text-sub">{sublabel}</p>
    </div>
  );
}

function SummaryPanel({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <div className="rounded-[24px] border border-line bg-card2 p-5">
      <p className="text-sm font-extrabold text-text">{title}</p>
      <div className="mt-4 space-y-3">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <p className="text-sm text-sub">{label}</p>
            <p className="max-w-[60%] text-right text-sm font-semibold text-text">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-3">
      <p className="text-sm font-semibold text-text">{label}</p>
      <span
        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
          ready ? "bg-primary/15 text-primary" : "bg-card text-sub"
        }`}
      >
        {ready ? "Connected" : "Missing"}
      </span>
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
