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
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Link2,
  LockKeyhole,
  Radio,
  Rocket,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AdminProject } from "@/types/entities/project";

type Props = {
  initialValues?: Omit<AdminProject, "id">;
  onSubmit: (values: Omit<AdminProject, "id">) => void;
  submitLabel?: string;
  layout?: "default" | "horizontal";
  mode?: "create" | "settings";
};

type StepId =
  | "identity"
  | "brand"
  | "links"
  | "context"
  | "public-profile"
  | "review";

type ProjectReadinessItem = {
  label: string;
  value: string;
  complete: boolean;
  priority: ProjectOnboardingPriority;
  step: StepId;
  action: string;
};

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

const projectInputClassName =
  "w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm text-text outline-none transition focus:border-primary/[0.26] focus:ring-2 focus:ring-primary/[0.14]";

export default function ProjectForm({
  initialValues,
  onSubmit,
  submitLabel = "Save Project",
  layout = "default",
  mode = "create",
}: Props) {
  const [values, setValues] = useState<Omit<AdminProject, "id">>(initialValues || defaultValues);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [currentStep, setCurrentStep] = useState<StepId>("identity");
  const [autoFocusedStep, setAutoFocusedStep] = useState(false);
  const isHorizontalLayout = layout === "horizontal";
  const isSettingsMode = mode === "settings";

  useEffect(() => {
    setValues(initialValues || defaultValues);
    setSlugTouched(Boolean(initialValues?.slug));
    setAutoFocusedStep(false);
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

  const brandingReadiness: ProjectReadinessItem[] = [
    {
      label: "Project basics",
      value: values.logo && values.name ? "Name and logo are ready" : "Add a project name and logo",
      complete: Boolean(values.logo && values.name),
      priority: "required",
      step: values.name && values.slug && values.chain ? "brand" : "identity",
      action: values.name && values.slug && values.chain ? "Add logo or brand mark" : "Complete basics",
    },
    {
      label: "Public copy",
      value: values.description ? "Short description is ready" : "Add a short public description",
      complete: Boolean(values.description),
      priority: "required",
      step: "public-profile",
      action: "Write public copy",
    },
    {
      label: "Community links",
      value: connectedLinks > 0 ? `${connectedLinks} channels connected` : "Connect at least one channel",
      complete: connectedLinks > 0,
      priority: "required",
      step: "links",
      action: "Connect a channel",
    },
    {
      label: "Launch context",
      value:
        values.launchPostUrl || values.docsUrl || values.waitlistUrl
          ? "Extra launch context is ready"
          : "Add docs, waitlist or launch links when available",
      complete: Boolean(values.launchPostUrl || values.docsUrl || values.waitlistUrl),
      priority: "recommended",
      step: "context",
      action: "Add launch context",
    },
    {
      label: "Visibility",
      value: values.isPublic ? "Project can appear publicly" : "Project remains private",
      complete: true,
      priority: "later",
      step: "public-profile",
      action: "Review visibility",
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
  const nextReadinessGap =
    brandingReadiness.find((item) => !item.complete && item.priority === "required") ??
    brandingReadiness.find((item) => !item.complete) ??
    null;
  const nextFocusStep = nextReadinessGap?.step ?? "review";
  const nextFocusMeta = steps.find((step) => step.id === nextFocusStep) ?? steps[steps.length - 1];
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

  useEffect(() => {
    if (!isHorizontalLayout || !isSettingsMode || autoFocusedStep) return;
    setCurrentStep(nextFocusStep);
    setAutoFocusedStep(true);
  }, [autoFocusedStep, isHorizontalLayout, isSettingsMode, nextFocusStep]);

  const stepItems = steps.map((step, index) => ({
    ...step,
    eyebrow: `Step ${index + 1}`,
    complete: stepCompletion[step.id],
  }));
  const editorSurface = (
    <div
      className={
        isHorizontalLayout
          ? "space-y-4 rounded-[18px] border border-white/[0.022] bg-[linear-gradient(180deg,rgba(12,15,22,0.98),rgba(8,10,15,0.96))] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.13)]"
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

      {currentStep === "identity"
        ? renderIdentity(values, setField, setSlugTouched, isSettingsMode)
        : null}
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
    isHorizontalLayout ? (
      <ProjectWorkspaceIntelligenceDock
        values={values}
        readiness={brandingReadiness}
        connectedModules={connectedModules}
        capabilitySignals={capabilitySignals}
        onSelectStep={setCurrentStep}
      />
    ) : (
      <BuilderSidebarStack
        sticky={false}
        className="xl:col-span-2 xl:grid xl:grid-cols-4 xl:gap-4 xl:space-y-0"
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
    )
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      {isHorizontalLayout ? (
        <ProjectFormCommandHeader
          progressPercent={progressPercent}
          readinessCount={readinessCount}
          readinessTotal={brandingReadiness.length}
          connectedLinks={connectedLinks}
          templateContextCount={templateContextCount}
          currentStep={currentStepMeta.label}
          mode={mode}
          nextActionLabel={nextReadinessGap?.action ?? "Review workspace"}
          nextActionStep={nextFocusMeta.label}
          onNextAction={() => setCurrentStep(nextFocusStep)}
        />
      ) : (
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
      )}

      {isHorizontalLayout ? (
        <div className="space-y-3">
          <BuilderHorizontalStepRail
            title="Workspace setup"
            description="Move from required basics into recommended polish without losing the next step."
            density="compact"
            steps={stepItems}
            currentStep={currentStep}
            onSelect={setCurrentStep}
          />
          {isSettingsMode ? (
            <>
              {editorSurface}
              {supportCards}
            </>
          ) : (
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
              {editorSurface}
              <ProjectCreationCommandDock
                values={values}
                readiness={brandingReadiness}
                connectedModules={connectedModules}
                capabilitySignals={capabilitySignals}
                currentStep={currentStepMeta.label}
                progressPercent={progressPercent}
                onSelectStep={setCurrentStep}
              />
            </div>
          )}
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
  setSlugTouched: (value: boolean) => void,
  showAdminState: boolean
) {
  const identityReady = Boolean(values.name && values.slug && values.chain);

  return (
    <div className="space-y-4">
      <SectionIntro
        title="Name the workspace and route it correctly"
        body="Project teams should only need the minimum creation payload first: name, slug, chain and category. Status controls stay out of the way during first-time creation."
      />

      <div className="rounded-[18px] border border-white/[0.026] bg-[radial-gradient(circle_at_5%_0%,rgba(199,255,0,0.055),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.012))] p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              Required creation payload
            </p>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-sub">
              These fields create the actual project workspace. Everything else can be tightened once Launch opens.
            </p>
          </div>
          <ProjectOnboardingPriorityPill priority={identityReady ? "complete" : "required"}>
            {identityReady ? "Ready" : "Needed"}
          </ProjectOnboardingPriorityPill>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <ProjectDockMetric label="Name" value={values.name ? "Ready" : "Missing"} quiet={!values.name} />
          <ProjectDockMetric label="Slug" value={values.slug ? "Ready" : "Missing"} quiet={!values.slug} />
          <ProjectDockMetric label="Chain" value={values.chain || "Missing"} quiet={!values.chain} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Project Name">
          <input
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            className={projectInputClassName}
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
            className={projectInputClassName}
            placeholder="pepe-raiders"
            required
          />
        </Field>

        <Field label="Chain">
          <select
            value={values.chain}
            onChange={(e) => setField("chain", e.target.value)}
            className={projectInputClassName}
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
            className={projectInputClassName}
            placeholder="Meme, DeFi, NFT, Gaming..."
          />
        </Field>
      </div>

      {showAdminState ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Status">
            <select
              value={values.status}
              onChange={(e) => setField("status", e.target.value as AdminProject["status"])}
              className={projectInputClassName}
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
              className={projectInputClassName}
            >
              <option value="draft">draft</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
            </select>
          </Field>
        </div>
      ) : null}
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
            className={projectInputClassName}
            placeholder="Rocket, monogram, or logo hint"
          />
        </Field>

        <Field label="Banner URL">
          <input
            value={values.bannerUrl || ""}
            onChange={(e) => setField("bannerUrl", e.target.value)}
            className={projectInputClassName}
            placeholder="https://..."
          />
        </Field>

        <Field label="Contact Email">
          <input
            type="email"
            value={values.contactEmail || ""}
            onChange={(e) => setField("contactEmail", e.target.value)}
            className={projectInputClassName}
            placeholder="team@project.com"
          />
        </Field>

        <Field label="Brand Accent">
          <input
            value={values.brandAccent || ""}
            onChange={(e) => setField("brandAccent", e.target.value)}
            className={projectInputClassName}
            placeholder="#C7FF00"
          />
        </Field>

        <Field label="Brand Mood">
          <input
            value={values.brandMood || ""}
            onChange={(e) => setField("brandMood", e.target.value)}
            className={projectInputClassName}
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
            className={projectInputClassName}
            placeholder="https://..."
          />
        </Field>

        <Field label="X URL">
          <input
            value={values.xUrl || ""}
            onChange={(e) => setField("xUrl", e.target.value)}
            className={projectInputClassName}
            placeholder="https://x.com/..."
          />
        </Field>

        <Field label="Telegram URL">
          <input
            value={values.telegramUrl || ""}
            onChange={(e) => setField("telegramUrl", e.target.value)}
            className={projectInputClassName}
            placeholder="https://t.me/..."
          />
        </Field>

        <Field label="Discord URL">
          <input
            value={values.discordUrl || ""}
            onChange={(e) => setField("discordUrl", e.target.value)}
            className={projectInputClassName}
            placeholder="https://discord.gg/..."
          />
        </Field>

        <Field label="Docs URL">
          <input
            value={values.docsUrl || ""}
            onChange={(e) => setField("docsUrl", e.target.value)}
            className={projectInputClassName}
            placeholder="https://docs..."
          />
        </Field>

        <Field label="Waitlist URL">
          <input
            value={values.waitlistUrl || ""}
            onChange={(e) => setField("waitlistUrl", e.target.value)}
            className={projectInputClassName}
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
            className={projectInputClassName}
            placeholder="https://x.com/.../status/..."
          />
        </Field>

        <Field label="Token Contract">
          <input
            value={values.tokenContractAddress || ""}
            onChange={(e) => setField("tokenContractAddress", e.target.value)}
            className={projectInputClassName}
            placeholder="0x..."
          />
        </Field>

        <Field label="NFT Contract">
          <input
            value={values.nftContractAddress || ""}
            onChange={(e) => setField("nftContractAddress", e.target.value)}
            className={projectInputClassName}
            placeholder="0x..."
          />
        </Field>

        <Field label="Primary Wallet">
          <input
            value={values.primaryWallet || ""}
            onChange={(e) => setField("primaryWallet", e.target.value)}
            className={projectInputClassName}
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
          className={projectInputClassName}
          placeholder="Short project description..."
        />
      </Field>

      <Field label="Long Description">
        <textarea
          value={values.longDescription || ""}
          onChange={(e) => setField("longDescription", e.target.value)}
          rows={8}
          className={projectInputClassName}
          placeholder="Longer project overview, mission, value proposition..."
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Members">
          <input
            type="number"
            value={values.members}
            onChange={(e) => setField("members", Number(e.target.value))}
            className={projectInputClassName}
            min={0}
          />
        </Field>

        <Field label="Campaign Count">
          <input
            type="number"
            value={values.campaigns}
            onChange={(e) => setField("campaigns", Number(e.target.value))}
            className={projectInputClassName}
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

function ProjectFormCommandHeader({
  progressPercent,
  readinessCount,
  readinessTotal,
  connectedLinks,
  templateContextCount,
  currentStep,
  mode,
  nextActionLabel,
  nextActionStep,
  onNextAction,
}: {
  progressPercent: number;
  readinessCount: number;
  readinessTotal: number;
  connectedLinks: number;
  templateContextCount: number;
  currentStep: string;
  mode: "create" | "settings";
  nextActionLabel: string;
  nextActionStep: string;
  onNextAction: () => void;
}) {
  const isSettingsMode = mode === "settings";
  const metrics = [
    ["Current", currentStep],
    ["Basics", `${readinessCount}/${readinessTotal}`],
    ["Links", String(connectedLinks)],
    ["Later", String(templateContextCount)],
  ];

  return (
    <section className="relative overflow-hidden rounded-[18px] border border-white/[0.024] bg-[linear-gradient(180deg,rgba(13,17,24,0.98),rgba(8,10,15,0.96))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" />
      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.56fr)_minmax(220px,0.42fr)] xl:items-center">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
            {isSettingsMode ? "Live workspace edit" : "Active setup"}
          </p>
          <h2 className="mt-1.5 text-[1.06rem] font-semibold tracking-[-0.02em] text-text md:text-[1.18rem]">
            {isSettingsMode
              ? "Tune the project without losing launch clarity"
              : "Create the workspace one decision at a time"}
          </h2>
          <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-sub">
            {isSettingsMode
              ? "Make profile, links and launch-context edits from one focused builder. The next missing input stays one click away."
              : "Start with the fields required to create a recognizable workspace. Launch, community and reward context can grow with the project."}
          </p>
        </div>

        <div className="min-w-0 rounded-[15px] border border-white/[0.022] bg-black/20 p-2.5">
          <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-2">
            {metrics.map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-[12px] bg-white/[0.016] px-2.5 py-2">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
                <p className="mt-1 truncate text-[12px] font-semibold text-text">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(199,255,0,0.82),rgba(102,255,198,0.92))]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onNextAction}
          className="group min-w-0 rounded-[15px] border border-primary/[0.14] bg-primary/[0.055] p-3 text-left transition hover:border-primary/[0.26] hover:bg-primary/[0.085]"
        >
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">
            Next field
          </p>
          <p className="mt-1 truncate text-[12px] font-semibold text-text">{nextActionLabel}</p>
          <span className="mt-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-primary">
            Open {nextActionStep}
            <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>
    </section>
  );
}

function ProjectCreationCommandDock({
  values,
  readiness,
  connectedModules,
  capabilitySignals,
  currentStep,
  progressPercent,
  onSelectStep,
}: {
  values: Omit<AdminProject, "id">;
  readiness: ProjectReadinessItem[];
  connectedModules: Array<{ label: string; value?: string }>;
  capabilitySignals: Array<{ label: string; ready: boolean; hint: string }>;
  currentStep: string;
  progressPercent: number;
  onSelectStep: (step: StepId) => void;
}) {
  const requiredItems = readiness.filter((item) => item.priority === "required");
  const requiredReady = requiredItems.filter((item) => item.complete).length;
  const readyCount = readiness.filter((item) => item.complete).length;
  const connectedCount = connectedModules.filter((item) => Boolean(item.value)).length;
  const unlockedCount = capabilitySignals.filter((item) => item.ready).length;
  const nextGap =
    readiness.find((item) => !item.complete && item.priority === "required") ??
    readiness.find((item) => !item.complete) ??
    null;

  return (
    <aside className="space-y-3 xl:sticky xl:top-4">
      <section className="relative overflow-hidden rounded-[20px] border border-primary/[0.12] bg-[radial-gradient(circle_at_12%_0%,rgba(199,255,0,0.09),transparent_28%),linear-gradient(180deg,rgba(13,17,24,0.98),rgba(8,10,15,0.96))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(199,255,0,0.24),transparent)]" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              Creation command
            </p>
            <h3 className="mt-2 text-[1rem] font-semibold tracking-[-0.025em] text-text">
              {nextGap ? nextGap.label : "Ready for Launch"}
            </h3>
            <p className="mt-1.5 text-[12px] leading-5 text-sub">
              {nextGap
                ? nextGap.value
                : "The required setup inputs are ready. Create the project and continue into Launch setup."}
            </p>
          </div>
          <ProjectOnboardingPriorityPill priority={nextGap ? nextGap.priority : "complete"}>
            {nextGap ? "Next" : "Ready"}
          </ProjectOnboardingPriorityPill>
        </div>

        <button
          type="button"
          onClick={() => onSelectStep(nextGap?.step ?? "review")}
          className="relative mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.13em] text-black transition hover:brightness-105"
        >
          {nextGap ? nextGap.action : "Review workspace"}
          <ArrowRight size={13} />
        </button>

        <div className="relative mt-3 grid grid-cols-2 gap-2">
          <ProjectDockMetric label="Step" value={currentStep} quiet />
          <ProjectDockMetric label="Progress" value={`${progressPercent}%`} quiet />
          <ProjectDockMetric label="Required" value={`${requiredReady}/${requiredItems.length}`} />
          <ProjectDockMetric label="Ready" value={`${readyCount}/${readiness.length}`} />
        </div>
      </section>

      <ProjectPreviewSurface values={values} compact />

      <section className="rounded-[20px] border border-white/[0.024] bg-[linear-gradient(180deg,rgba(12,15,22,0.96),rgba(8,10,15,0.94))] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sub">
              After creation
            </p>
            <p className="mt-1 text-[12px] font-semibold text-text">
              Launch setup opens next
            </p>
          </div>
          <Rocket size={16} className="shrink-0 text-primary" />
        </div>
        <p className="mt-2 text-[12px] leading-5 text-sub">
          The submit action keeps the existing backend behavior: create or request the project, then route the workspace into its next setup surface.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ProjectDockMetric label="Channels" value={`${connectedCount}/6`} quiet />
          <ProjectDockMetric label="Unlocks" value={`${unlockedCount}/${capabilitySignals.length}`} quiet />
        </div>
      </section>

      <section className="rounded-[20px] border border-white/[0.024] bg-black/20 p-3.5">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sub">
          Setup gates
        </p>
        <div className="mt-3 grid gap-2">
          {readiness.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectStep(item.step)}
              className={cn(
                "grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 rounded-[13px] border px-3 py-2 text-left transition hover:bg-white/[0.026]",
                item.complete
                  ? "border-emerald-300/[0.12] bg-emerald-300/[0.035]"
                  : item.priority === "required"
                    ? "border-primary/[0.13] bg-primary/[0.04]"
                    : "border-white/[0.024] bg-white/[0.014]"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-black",
                  item.complete
                    ? "border-emerald-300/[0.22] bg-emerald-300/[0.07] text-emerald-200"
                    : "border-white/[0.05] bg-black/[0.18] text-sub"
                )}
              >
                {item.complete ? <CheckCircle2 size={13} /> : index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-text">{item.label}</p>
                <p className="mt-0.5 truncate text-[10px] text-sub">{item.value}</p>
              </div>
              <ArrowRight size={12} className="shrink-0 text-primary" />
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

function ProjectWorkspaceIntelligenceDock({
  values,
  readiness,
  connectedModules,
  capabilitySignals,
  onSelectStep,
}: {
  values: Omit<AdminProject, "id">;
  readiness: ProjectReadinessItem[];
  connectedModules: Array<{ label: string; value?: string }>;
  capabilitySignals: Array<{ label: string; ready: boolean; hint: string }>;
  onSelectStep: (step: StepId) => void;
}) {
  const requiredItems = readiness.filter((item) => item.priority === "required");
  const requiredReady = requiredItems.filter((item) => item.complete).length;
  const readyCount = readiness.filter((item) => item.complete).length;
  const readinessPercent = Math.round((readyCount / readiness.length) * 100);
  const requiredMissing = requiredItems.length - requiredReady;
  const connectedCount = connectedModules.filter((item) => Boolean(item.value)).length;
  const unlockedCount = capabilitySignals.filter((item) => item.ready).length;
  const nextGap =
    readiness.find((item) => !item.complete && item.priority === "required") ??
    readiness.find((item) => !item.complete) ??
    null;
  const identityReady = Boolean(readiness.find((item) => item.label === "Project basics")?.complete);
  const storyReady = Boolean(readiness.find((item) => item.label === "Public copy")?.complete);
  const communityReady = Boolean(readiness.find((item) => item.label === "Community links")?.complete);
  const launchReady = Boolean(readiness.find((item) => item.label === "Launch context")?.complete);
  const routeSteps = [
    { label: "Identity", body: "Name, logo and slug", ready: identityReady, step: "identity" as const },
    { label: "Story", body: "Short public copy", ready: storyReady, step: "public-profile" as const },
    { label: "Channels", body: "At least one route", ready: communityReady, step: "links" as const },
    { label: "Launch", body: "Docs, waitlist or post", ready: launchReady, step: "context" as const },
  ];

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-white/[0.024] bg-[radial-gradient(circle_at_9%_0%,rgba(199,255,0,0.085),transparent_25%),radial-gradient(circle_at_92%_7%,rgba(0,255,163,0.055),transparent_24%),linear-gradient(180deg,rgba(11,14,20,0.985),rgba(7,9,14,0.965))] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.014)_1px,transparent_1px)] bg-[length:64px_64px] opacity-[0.35]" />

      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(290px,0.36fr)] xl:items-start">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Launch cockpit
          </p>
          <h3 className="mt-1.5 text-[1.05rem] font-semibold tracking-[-0.025em] text-text md:text-[1.18rem]">
            One command view for preview, blockers and rails
          </h3>
          <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-sub">
            Teams can see what is public, what blocks launch, and which modules become useful next.
          </p>
        </div>

        <div className="rounded-[16px] border border-white/[0.026] bg-black/25 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">
                Readiness score
              </p>
              <p className="mt-1 text-[1.15rem] font-semibold tracking-[-0.03em] text-text">
                {readinessPercent}%
              </p>
            </div>
            <ProjectDockMetric label="Required" value={`${requiredReady}/${requiredItems.length}`} />
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.055]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(199,255,0,0.82),rgba(0,255,163,0.82))] shadow-[0_0_18px_rgba(199,255,0,0.2)]"
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ProjectDockMetric label="Channels" value={`${connectedCount}/6`} quiet />
            <ProjectDockMetric label="Unlocks" value={`${unlockedCount}/${capabilitySignals.length}`} quiet />
          </div>
        </div>
      </div>

      <div className="relative mt-4 grid gap-3 2xl:grid-cols-[minmax(260px,0.86fr)_minmax(360px,1.16fr)_minmax(270px,0.86fr)]">
        <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-1">
          <div className="overflow-hidden rounded-[18px] border border-white/[0.024] bg-black/20">
            <div
              className="h-16 bg-gradient-to-br from-primary/15 via-card to-card2"
              style={
                values.bannerUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg,rgba(7,9,14,0.08),rgba(7,9,14,0.3)),url(${values.bannerUrl})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }
                  : values.brandAccent
                  ? {
                      backgroundImage: `linear-gradient(135deg, ${values.brandAccent}24, rgba(10,12,18,0.86), rgba(18,22,32,0.98))`,
                    }
                  : undefined
              }
            />
            <div className="p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-white/[0.032] bg-white/[0.04] text-[1.16rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  {values.logo || "\uD83D\uDE80"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
                    {values.name || "Project name"}
                  </p>
                  <p className="truncate text-[12px] text-sub">/{values.slug || "project-slug"}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-sub">
                {values.description || "Short public description will appear here."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <PreviewBadge>{values.chain}</PreviewBadge>
                <PreviewBadge>{values.isPublic ? "Public" : "Private"}</PreviewBadge>
                {values.category ? <PreviewBadge>{values.category}</PreviewBadge> : null}
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-white/[0.024] bg-white/[0.014] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sub">
                  Handoff route
                </p>
                <p className="mt-1 text-[12px] font-semibold text-text">
                  From project basics to launch modules
                </p>
              </div>
              <Rocket size={16} className="shrink-0 text-primary" />
            </div>
            <div className="mt-3 grid gap-2">
              {routeSteps.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onSelectStep(item.step)}
                  className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 rounded-[13px] bg-black/[0.18] px-3 py-2 text-left transition hover:bg-white/[0.026]"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-black",
                      item.ready
                        ? "border-emerald-300/[0.22] bg-emerald-300/[0.07] text-emerald-200"
                        : "border-white/[0.05] bg-white/[0.018] text-sub"
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-text">{item.label}</p>
                    <p className="mt-0.5 truncate text-[10px] text-sub">{item.body}</p>
                  </div>
                  {item.ready ? (
                    <CheckCircle2 size={15} className="text-emerald-200" />
                  ) : (
                    <CircleAlert size={15} className="text-sub" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-primary/[0.12] bg-[linear-gradient(135deg,rgba(199,255,0,0.075),rgba(255,255,255,0.018)_34%,rgba(0,255,163,0.035))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border",
                  nextGap
                    ? "border-primary/[0.22] bg-primary/[0.075] text-primary"
                    : "border-emerald-300/[0.24] bg-emerald-300/[0.075] text-emerald-200"
                )}
              >
                {nextGap ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                  Next project action
                </p>
                <h4 className="mt-1 text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
                  {nextGap ? nextGap.label : "Ready for launch setup"}
                </h4>
                <p className="mt-1.5 max-w-xl text-[12px] leading-5 text-sub">
                  {nextGap
                    ? nextGap.value
                    : "Required inputs are ready. The project can move into profile polish, community routes and launch modules."}
                </p>
              </div>
            </div>
            <ProjectOnboardingPriorityPill priority={nextGap ? nextGap.priority : "complete"}>
              {nextGap
                ? nextGap.priority === "required"
                  ? `${requiredMissing} blocker${requiredMissing === 1 ? "" : "s"}`
                  : "Recommended"
                : "Ready"}
            </ProjectOnboardingPriorityPill>
          </div>
          <button
            type="button"
            onClick={() => onSelectStep(nextGap?.step ?? "review")}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-[11px] font-black text-black transition hover:brightness-105"
          >
            {nextGap ? nextGap.action : "Review workspace"}
            <ArrowRight size={13} />
          </button>

          <div className="mt-4 grid gap-2">
            {readiness.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "grid gap-2 rounded-[14px] border px-3 py-2.5 sm:grid-cols-[28px_minmax(0,1fr)_auto] sm:items-center",
                  item.complete
                    ? "border-emerald-300/[0.1] bg-emerald-300/[0.035]"
                    : item.priority === "required"
                      ? "border-primary/[0.13] bg-primary/[0.04]"
                      : "border-white/[0.024] bg-black/[0.18]"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black",
                    item.complete
                      ? "border-emerald-300/[0.22] bg-emerald-300/[0.07] text-emerald-200"
                      : item.priority === "required"
                        ? "border-primary/[0.24] bg-primary/[0.07] text-primary"
                        : "border-white/[0.05] bg-white/[0.02] text-sub"
                  )}
                >
                  {item.complete ? <CheckCircle2 size={14} /> : index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-text">{item.label}</p>
                  <p className="mt-0.5 truncate text-[11px] text-sub">{item.value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectStep(item.step)}
                  className={cn(
                    "inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] transition",
                    item.complete
                      ? "bg-emerald-300/[0.075] text-emerald-200 hover:bg-emerald-300/[0.11]"
                      : item.priority === "required"
                        ? "bg-primary/[0.09] text-primary hover:bg-primary/[0.13]"
                        : "bg-white/[0.055] text-sub hover:bg-white/[0.08]"
                  )}
                >
                  <span className="max-w-[128px] truncate">{item.complete ? "Review" : item.action}</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-1">
          <div className="rounded-[18px] border border-white/[0.024] bg-black/20 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sub">
                  Connected rails
                </p>
                <p className="mt-1 text-[12px] font-semibold text-text">
                  {connectedCount} active module{connectedCount === 1 ? "" : "s"}
                </p>
              </div>
              <Radio size={16} className="shrink-0 text-primary" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {connectedModules.map((item) => (
                <SignalChip key={item.label} label={item.label} ready={Boolean(item.value)} />
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-white/[0.024] bg-white/[0.014] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-sub">
                  Smart unlocks
                </p>
                <p className="mt-1 text-[12px] font-semibold text-text">
                  {unlockedCount} ready for automation
                </p>
              </div>
              <Sparkles size={16} className="shrink-0 text-primary" />
            </div>
            <div className="mt-3 grid gap-2">
              {capabilitySignals.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[26px_minmax(0,1fr)_auto] items-center gap-2 rounded-[13px] bg-black/[0.18] px-3 py-2"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full",
                      item.ready ? "bg-primary/[0.08] text-primary" : "bg-white/[0.045] text-sub"
                    )}
                  >
                    {item.ready ? <Sparkles size={13} /> : <LockKeyhole size={13} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-text">{item.label}</p>
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-sub">{item.hint}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]",
                      item.ready ? "bg-primary/[0.075] text-primary" : "bg-white/[0.05] text-sub"
                    )}
                  >
                    {item.ready ? "Live" : "Later"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectDockMetric({
  label,
  value,
  quiet = false,
}: {
  label: string;
  value: string;
  quiet?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[13px] border px-3 py-2",
        quiet
          ? "border-white/[0.02] bg-white/[0.012]"
          : "border-primary/[0.12] bg-primary/[0.055]"
      )}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}

function SignalChip({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[16px_minmax(0,1fr)_8px] items-center gap-2 rounded-[12px] border px-2.5 py-2",
        ready
          ? "border-primary/[0.18] bg-primary/[0.055]"
          : "border-white/[0.024] bg-black/[0.18]"
      )}
    >
      <Link2
        size={13}
        className={cn("shrink-0", ready ? "text-primary" : "text-sub")}
      />
      <span className="truncate text-[11px] font-semibold text-text">{label}</span>
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          ready ? "bg-primary shadow-[0_0_12px_rgba(199,255,0,0.38)]" : "bg-white/[0.18]"
        )}
      />
    </div>
  );
}

function ProjectPreviewSurface({
  values,
  compact = false,
}: {
  values: Omit<AdminProject, "id">;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 self-start overflow-hidden rounded-[20px] border border-white/[0.028] bg-[linear-gradient(180deg,rgba(13,17,24,0.98),rgba(8,10,15,0.96))] shadow-[0_10px_24px_rgba(0,0,0,0.13)]",
        compact ? "" : "xl:col-span-2"
      )}
    >
      <div
        className={cn(
          "bg-gradient-to-br from-primary/15 via-card to-card2",
          compact ? "h-20" : "h-40"
        )}
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

      <div className={compact ? "p-3.5" : "p-4"}>
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
          Public Project Preview
        </p>
        <div className={cn("flex items-center gap-3", compact ? "mt-3" : "mt-4")}>
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-[18px] border border-white/[0.032] bg-white/[0.04]",
              compact ? "h-10 w-10 text-[1.1rem]" : "h-12 w-12 text-[1.35rem]"
            )}
          >
            {values.logo || "\uD83D\uDE80"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[0.98rem] font-semibold text-text">
              {values.name || "Project name"}
            </p>
            <p className="truncate text-sm text-sub">/{values.slug || "project-slug"}</p>
          </div>
        </div>

        <p
          className={cn(
            "mt-3 break-words text-[12px] leading-5 text-sub [overflow-wrap:anywhere]",
            compact ? "line-clamp-2" : ""
          )}
        >
          {values.description || "Short public description will appear here."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <PreviewBadge>{values.chain}</PreviewBadge>
          {values.category ? <PreviewBadge>{values.category}</PreviewBadge> : null}
          <PreviewBadge>{values.isPublic ? "Public" : "Private"}</PreviewBadge>
          {values.brandMood ? <PreviewBadge>{values.brandMood}</PreviewBadge> : null}
        </div>

        {compact ? null : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <PreviewStat label="Members" value={String(values.members)} />
            <PreviewStat label="Campaigns" value={String(values.campaigns)} />
          </div>
        )}
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
