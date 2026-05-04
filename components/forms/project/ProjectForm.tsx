"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BuilderBottomNav,
  BuilderHero,
  BuilderHorizontalStepRail,
  BuilderMetricCard,
  BuilderSidebarCard,
  BuilderSidebarStack,
  BuilderStepHeader,
  BuilderStepRail,
} from "@/components/layout/builder/BuilderPrimitives";
import {
  ProjectOnboardingPriorityPill,
  type ProjectOnboardingPriority,
} from "@/components/projects/onboarding/ProjectOnboardingPrimitives";
import { AdminProject } from "@/types/entities/project";

type Props = {
  initialValues?: Omit<AdminProject, "id">;
  onSubmit: (values: Omit<AdminProject, "id">) => void;
  submitLabel?: string;
  layout?: "default" | "horizontal";
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
  description: string;
}> = [
  {
    id: "identity",
    label: "Basics",
    description: "Add the name, slug and chain so the workspace can exist.",
  },
  {
    id: "brand",
    label: "Look and feel",
    description: "Set the visual identity users will see first.",
  },
  {
    id: "links",
    label: "Community links",
    description: "Connect the places members should visit, join or verify.",
  },
  {
    id: "context",
    label: "Launch context",
    description: "Add token, wallet or launch links when they are ready.",
  },
  {
    id: "public-profile",
    label: "Public story",
    description: "Write the project story that members and reviewers can trust.",
  },
  {
    id: "review",
    label: "Review",
    description: "Check what is ready now and what can wait until later.",
  },
];

export default function ProjectForm({
  initialValues,
  onSubmit,
  submitLabel = "Save Project",
  layout = "default",
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

  const brandingReadiness: Array<{
    label: string;
    value: string;
    complete: boolean;
    priority: ProjectOnboardingPriority;
  }> = [
    {
      label: "Project basics",
      value: values.logo && values.name ? "Name and logo are ready" : "Add a project name and logo",
      complete: Boolean(values.logo && values.name),
      priority: "required",
    },
    {
      label: "Public copy",
      value: values.description ? "Short description is ready" : "Add a short public description",
      complete: Boolean(values.description),
      priority: "required",
    },
    {
      label: "Community links",
      value: connectedLinks > 0 ? `${connectedLinks} channels connected` : "Connect at least one channel",
      complete: connectedLinks > 0,
      priority: "required",
    },
    {
      label: "Launch context",
      value:
        values.launchPostUrl || values.docsUrl || values.waitlistUrl
          ? "Extra launch context is ready"
          : "Add docs, waitlist or launch links when available",
      complete: Boolean(values.launchPostUrl || values.docsUrl || values.waitlistUrl),
      priority: "recommended",
    },
    {
      label: "Visibility",
      value: values.isPublic ? "Project can appear publicly" : "Project remains private",
      complete: true,
      priority: "later",
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
  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);
  const connectedModules = [
    { label: "Website", value: values.website },
    { label: "X", value: values.xUrl },
    { label: "Telegram", value: values.telegramUrl },
    { label: "Discord", value: values.discordUrl },
    { label: "Docs", value: values.docsUrl },
    { label: "Waitlist", value: values.waitlistUrl },
  ];
  const capabilitySignals = [
    {
      label: "Launch Templates",
      ready: Boolean(values.launchPostUrl || values.website || values.xUrl),
      hint: values.launchPostUrl
        ? "Launch post is connected"
        : "Add a launch post to unlock cleaner social sprint autofill",
    },
    {
      label: "Holder Flows",
      ready: Boolean(values.tokenContractAddress || values.nftContractAddress),
      hint: values.tokenContractAddress
        ? "Token context is ready"
        : "Add contract data for holder-first campaign paths",
    },
    {
      label: "Referral Loops",
      ready: Boolean(values.waitlistUrl || values.website),
      hint: values.waitlistUrl
        ? "Waitlist path is connected"
        : "Add a waitlist or destination URL for conversion loops",
    },
    {
      label: "Creator Research",
      ready: Boolean(values.docsUrl),
      hint: values.docsUrl
        ? "Docs can be routed into creator tasks"
        : "Connect docs to support research and creator templates",
    },
  ];

  const setField = <K extends keyof Omit<AdminProject, "id">>(
    key: K,
    value: Omit<AdminProject, "id">[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };
  const stepItems = steps.map((step, index) => ({
    ...step,
    eyebrow: `Step ${index + 1}`,
    complete: stepCompletion[step.id],
  }));
  const editorSurface = (
    <div
      className={
        layout === "horizontal"
          ? "space-y-4 rounded-[20px] bg-[linear-gradient(180deg,rgba(12,15,22,0.98),rgba(8,10,15,0.96))] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.13)]"
          : "space-y-4 rounded-[20px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(12,15,22,0.98),rgba(8,10,15,0.96))] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.16)]"
      }
    >
      <BuilderStepHeader
        eyebrow={`Step ${currentStepIndex + 1}`}
        title={currentStepMeta.label}
        description={currentStepMeta.description}
        stepIndex={currentStepIndex + 1}
        totalSteps={steps.length}
      />

      {currentStep === "identity" ? renderIdentity(values, setField, setSlugTouched) : null}
      {currentStep === "brand" ? renderBrand(values, setField) : null}
      {currentStep === "links" ? renderLinks(values, setField) : null}
      {currentStep === "context" ? renderContext(values, setField) : null}
      {currentStep === "public-profile" ? renderPublicProfile(values, setField) : null}
      {currentStep === "review" ? renderReview(values, brandingReadiness, connectedLinks, templateContextCount) : null}

      <BuilderBottomNav
        canGoBack={Boolean(previousStep)}
        onBack={() => previousStep && setCurrentStep(previousStep.id)}
        nextLabel={nextStep ? `Continue to ${nextStep.label}` : undefined}
        onNext={nextStep ? () => setCurrentStep(nextStep.id) : undefined}
        footerLabel={`Step ${currentStepIndex + 1} - ${currentStepMeta.label}`}
        submitButton={
          nextStep ? (
            undefined
          ) : (
            <button className="rounded-2xl bg-primary px-5 py-3 font-bold text-black">
              {submitLabel}
            </button>
          )
        }
      />
    </div>
  );
  const supportCards = (
    <BuilderSidebarStack
      sticky={false}
      className={
        layout === "horizontal"
          ? ""
          : "xl:col-span-2 xl:grid xl:grid-cols-4 xl:gap-4 xl:space-y-0"
      }
    >
      <ProjectPreviewSurface values={values} />

      <BuilderSidebarCard title="Launch Readiness">
        <div className="space-y-2">
          {brandingReadiness.map((item) => (
            <div key={item.label} className="rounded-[14px] bg-white/[0.018] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-text">{item.label}</p>
                <ProjectOnboardingPriorityPill
                  priority={item.complete ? "complete" : item.priority}
                />
              </div>
              <p className="mt-2 text-[12px] leading-5 text-sub">{item.value}</p>
            </div>
          ))}
        </div>
      </BuilderSidebarCard>

      <BuilderSidebarCard title="Connected Modules">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {connectedModules.map((item) => (
            <ConnectedModuleCard
              key={item.label}
              label={item.label}
              ready={Boolean(item.value)}
            />
          ))}
        </div>
      </BuilderSidebarCard>

      <BuilderSidebarCard title="Unlocks Later">
        <div className="space-y-2.5">
          {capabilitySignals.map((item) => (
            <div
              key={item.label}
              className="rounded-[14px] bg-white/[0.018] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-text">{item.label}</p>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                    item.ready
                      ? "bg-primary/[0.075] text-primary"
                      : "bg-white/5 text-sub"
                  }`}
                >
                  {item.ready ? "Unlocked" : "Not ready"}
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-sub">{item.hint}</p>
            </div>
          ))}
        </div>
      </BuilderSidebarCard>
    </BuilderSidebarStack>
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <BuilderHero
        eyebrow="Project setup"
        title="Create the workspace one clear decision at a time"
        description="Start with the fields needed for launch, then add polish and advanced context only when the project has it ready."
        progressPercent={progressPercent}
        metrics={
          <>
            <BuilderMetricCard label="Launch basics" value={`${readinessCount}/${brandingReadiness.length}`} sublabel="ready inputs" />
            <BuilderMetricCard label="Community links" value={String(connectedLinks)} sublabel="connected" />
            <BuilderMetricCard label="Can wait" value={String(templateContextCount)} sublabel="advanced inputs" />
          </>
        }
      />

      {layout === "horizontal" ? (
        <div className="space-y-4">
          <BuilderHorizontalStepRail
            title="Workspace setup"
            description="Move from required basics into recommended polish without losing the next step."
            steps={stepItems}
            currentStep={currentStep}
            onSelect={setCurrentStep}
          />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
            {editorSurface}
            {supportCards}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start">
          <BuilderStepRail
            steps={stepItems}
            currentStep={currentStep}
            onSelect={setCurrentStep}
          />
          {editorSurface}
          {supportCards}
        </div>
      )}
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
        title="Start with the fields needed to create the workspace"
        body="These basics make the project easy to recognize across the portal, public pages and launch tools."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Project Name">
          <input
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="pepe-raiders"
            required
          />
        </Field>

        <Field label="Chain">
          <select
            value={values.chain}
            onChange={(e) => setField("chain", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="Meme, DeFi, NFT, Gaming..."
          />
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(e) => setField("status", e.target.value as AdminProject["status"])}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
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
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
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
        title="Make the project feel credible before users arrive"
        body="Add the logo, banner and brand cues that help the public page and launch assets feel intentional."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Logo / Emoji">
          <input
            value={values.logo}
            onChange={(e) => setField("logo", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="Rocket, monogram, or logo hint"
          />
        </Field>

        <Field label="Banner URL">
          <input
            value={values.bannerUrl || ""}
            onChange={(e) => setField("bannerUrl", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="https://..."
          />
        </Field>

        <Field label="Contact Email">
          <input
            type="email"
            value={values.contactEmail || ""}
            onChange={(e) => setField("contactEmail", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="team@project.com"
          />
        </Field>

        <Field label="Brand Accent">
          <input
            value={values.brandAccent || ""}
            onChange={(e) => setField("brandAccent", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="#C7FF00"
          />
        </Field>

        <Field label="Brand Mood">
          <input
            value={values.brandMood || ""}
            onChange={(e) => setField("brandMood", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
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
        title="Connect the places members should go"
        body="Add the channels and destinations that campaigns, quests and raids can reuse later."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Website">
          <input
            value={values.website || ""}
            onChange={(e) => setField("website", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="https://..."
          />
        </Field>

        <Field label="X URL">
          <input
            value={values.xUrl || ""}
            onChange={(e) => setField("xUrl", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="https://x.com/..."
          />
        </Field>

        <Field label="Telegram URL">
          <input
            value={values.telegramUrl || ""}
            onChange={(e) => setField("telegramUrl", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="https://t.me/..."
          />
        </Field>

        <Field label="Discord URL">
          <input
            value={values.discordUrl || ""}
            onChange={(e) => setField("discordUrl", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="https://discord.gg/..."
          />
        </Field>

        <Field label="Docs URL">
          <input
            value={values.docsUrl || ""}
            onChange={(e) => setField("docsUrl", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="https://docs..."
          />
        </Field>

        <Field label="Waitlist URL">
          <input
            value={values.waitlistUrl || ""}
            onChange={(e) => setField("waitlistUrl", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
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
        title="Add advanced context only when it is ready"
        body="Token, NFT, wallet and launch links unlock better automation later, but they should not block the first workspace setup."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Launch Post URL">
          <input
            value={values.launchPostUrl || ""}
            onChange={(e) => setField("launchPostUrl", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="https://x.com/.../status/..."
          />
        </Field>

        <Field label="Token Contract">
          <input
            value={values.tokenContractAddress || ""}
            onChange={(e) => setField("tokenContractAddress", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="0x..."
          />
        </Field>

        <Field label="NFT Contract">
          <input
            value={values.nftContractAddress || ""}
            onChange={(e) => setField("nftContractAddress", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            placeholder="0x..."
          />
        </Field>

        <Field label="Primary Wallet">
          <input
            value={values.primaryWallet || ""}
            onChange={(e) => setField("primaryWallet", e.target.value)}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
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
        title="Write the story users and reviewers will read"
        body="Keep the short description clear first, then use the longer story for context, positioning and credibility."
      />

      <Field label="Description">
        <textarea
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={5}
          className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
          placeholder="Short project description..."
        />
      </Field>

      <Field label="Long Description">
        <textarea
          value={values.longDescription || ""}
          onChange={(e) => setField("longDescription", e.target.value)}
          rows={8}
          className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
          placeholder="Longer project overview, mission, value proposition..."
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Members">
          <input
            type="number"
            value={values.members}
            onChange={(e) => setField("members", Number(e.target.value))}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
            min={0}
          />
        </Field>

        <Field label="Campaign Count">
          <input
            type="number"
            value={values.campaigns}
            onChange={(e) => setField("campaigns", Number(e.target.value))}
            className="w-full rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-3 outline-none"
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
        title="Review what is ready and what can wait"
        body="The project can start once the required basics are clear. Recommended and advanced inputs can be tightened later."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {brandingReadiness.map((item) => (
          <div key={item.label} className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-text">{item.label}</p>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                  item.complete ? "bg-primary/[0.075] text-primary" : "bg-amber-500/[0.075] text-amber-300"
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
    <div className="border-b border-white/[0.026] pb-3.5">
      <p className="text-[0.98rem] font-semibold tracking-[-0.02em] text-text">{title}</p>
      <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-sub">{body}</p>
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
      <span className="mb-2 block text-[12px] font-semibold tracking-[-0.01em] text-text">{label}</span>
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
    <label className="flex items-center justify-between rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-2.5">
      <span className="text-[12px] font-semibold text-text">{label}</span>
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
    <span className="rounded-full border border-white/[0.026] bg-white/[0.016] px-2.5 py-1 text-[10px] font-bold text-text">
      {children}
    </span>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-2.5">
      <p className="text-[12px] text-sub">{label}</p>
      <p className="mt-1.5 text-[0.98rem] font-semibold text-text">{value}</p>
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
    <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary">{title}</p>
      <div className="mt-3 space-y-2.5">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 border-b border-white/[0.026] pb-2.5 last:border-b-0 last:pb-0">
            <p className="text-[12px] text-sub">{label}</p>
            <p className="max-w-[60%] break-words text-right text-[12px] font-semibold text-text [overflow-wrap:anywhere]">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectPreviewSurface({
  values,
}: {
  values: Omit<AdminProject, "id">;
}) {
  return (
    <div className="min-w-0 self-start overflow-hidden rounded-[20px] border border-white/[0.028] bg-[linear-gradient(180deg,rgba(13,17,24,0.98),rgba(8,10,15,0.96))] shadow-[0_10px_24px_rgba(0,0,0,0.13)] xl:col-span-2">
      <div
        className="h-40 bg-gradient-to-br from-primary/15 via-card to-card2"
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

      <div className="p-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
          Public Project Preview
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/[0.032] bg-white/[0.04] text-[1.35rem]">
            {values.logo || "\uD83D\uDE80"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[0.98rem] font-semibold text-text">
              {values.name || "Project name"}
            </p>
            <p className="truncate text-sm text-sub">/{values.slug || "project-slug"}</p>
          </div>
        </div>

        <p className="mt-3 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]">
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
  );
}

function ConnectedModuleCard({
  label,
  ready,
}: {
  label: string;
  ready: boolean;
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-2.5">
      <div className="space-y-3">
        <p className="text-[12px] font-semibold text-text">{label}</p>
        <span
          className={`inline-flex max-w-full self-start rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
            ready ? "bg-primary/[0.075] text-primary" : "bg-white/5 text-sub"
          }`}
        >
          {ready ? "Connected" : "Missing"}
        </span>
      </div>
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
