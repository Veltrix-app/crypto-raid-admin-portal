"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import RaidActionCanvas from "@/components/forms/raid/RaidActionCanvas";
import RaidLaunchRail from "@/components/forms/raid/RaidLaunchRail";
import RaidMemberPreview from "@/components/forms/raid/RaidMemberPreview";
import RaidVerificationRail from "@/components/forms/raid/RaidVerificationRail";
import StudioModeToggle from "@/components/forms/studio/StudioModeToggle";
import StudioPreviewCard from "@/components/forms/studio/StudioPreviewCard";
import StudioShell from "@/components/forms/studio/StudioShell";
import StudioStepRail from "@/components/forms/studio/StudioStepRail";
import StudioTopFrame from "@/components/forms/studio/StudioTopFrame";
import StudioWarningRail from "@/components/forms/studio/StudioWarningRail";
import {
  BuilderBottomNav,
  BuilderMetricCard,
  BuilderStepHeader,
} from "@/components/layout/builder/BuilderPrimitives";
import {
  getRaidLaunchWarnings,
  getRaidMemberPreview,
  getRaidStudioReadiness,
} from "@/lib/studio/raid-studio";
import type { AdminCampaign } from "@/types/entities/campaign";
import type { AdminProject } from "@/types/entities/project";
import type { AdminRaid } from "@/types/entities/raid";

type Props = {
  projects: AdminProject[];
  campaigns: AdminCampaign[];
  initialValues?: Omit<AdminRaid, "id">;
  defaultProjectId?: string;
  defaultCampaignId?: string;
  onSubmit: (values: Omit<AdminRaid, "id">) => void | Promise<void>;
  submitLabel?: string;
};

type RaidBuilderStepId = "action" | "placement" | "verification" | "launch";

const raidBuilderSteps: Array<{
  id: RaidBuilderStepId;
  label: string;
  description: string;
}> = [
  {
    id: "action",
    label: "Action",
    description: "Define the raid wave, the community it belongs to, and the one action members should feel immediately.",
  },
  {
    id: "placement",
    label: "Placement",
    description: "Attach the raid to the right project and campaign lane, then wire the real destination and contributor steps.",
  },
  {
    id: "verification",
    label: "Verify",
    description: "Choose the proof route and make the verification layer stable before the pressure goes live.",
  },
  {
    id: "launch",
    label: "Launch",
    description: "Tune urgency, XP, timing and status so the raid ships with a clean posture.",
  },
];

const PLATFORM_OPTIONS: AdminRaid["platform"][] = [
  "x",
  "telegram",
  "discord",
  "website",
  "reddit",
  "custom",
];

const VERIFICATION_OPTIONS: AdminRaid["verificationType"][] = [
  "manual_confirm",
  "api_follow_check",
  "api_like_check",
  "api_repost_check",
  "telegram_bot_check",
  "discord_role_check",
  "url_click",
];

export default function RaidForm({
  projects,
  campaigns,
  initialValues,
  defaultProjectId,
  defaultCampaignId,
  onSubmit,
  submitLabel = "Save Raid",
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [builderMode, setBuilderMode] = useState<"basic" | "advanced">("basic");
  const [currentStep, setCurrentStep] = useState<RaidBuilderStepId>("action");
  const [values, setValues] = useState<Omit<AdminRaid, "id">>(
    initialValues || {
      projectId: defaultProjectId || projects[0]?.id || "",
      campaignId: defaultCampaignId || "",
      title: "",
      shortDescription: "",
      community: "",
      target: "",
      banner: "",
      rewardXp: 0,
      participants: 0,
      progress: 0,
      timer: "",
      platform: "x",
      targetUrl: "",
      targetPostId: "",
      targetAccountHandle: "",
      verificationType: "manual_confirm",
      verificationConfig: "",
      instructions: [""],
      startsAt: "",
      endsAt: "",
      status: "draft",
    }
  );

  const filteredCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.projectId === values.projectId),
    [campaigns, values.projectId]
  );
  const selectedProject = projects.find((project) => project.id === values.projectId);
  const selectedCampaign = filteredCampaigns.find((campaign) => campaign.id === values.campaignId);
  const memberPreview = useMemo(() => getRaidMemberPreview(values), [values]);
  const readinessItems = useMemo(
    () =>
      getRaidStudioReadiness({
        values,
        campaignCount: filteredCampaigns.length,
      }),
    [filteredCampaigns.length, values]
  );
  const launchWarnings = useMemo(() => getRaidLaunchWarnings({ values }), [values]);
  const currentStepIndex = raidBuilderSteps.findIndex((step) => step.id === currentStep);
  const currentStepMeta = raidBuilderSteps[currentStepIndex];
  const previousStep = raidBuilderSteps[currentStepIndex - 1];
  const nextStep = raidBuilderSteps[currentStepIndex + 1];
  const progressPercent = Math.round(((currentStepIndex + 1) / raidBuilderSteps.length) * 100);
  const normalizedInstructions = useMemo(
    () => values.instructions.filter((item) => item.trim().length > 0),
    [values.instructions]
  );
  const verificationJsonValid = useMemo(
    () => isValidJson(values.verificationConfig),
    [values.verificationConfig]
  );

  const stepCompletion: Record<RaidBuilderStepId, boolean> = {
    action: Boolean(values.title.trim() && values.community.trim() && values.target.trim()),
    placement: Boolean(values.projectId && values.campaignId && values.targetUrl?.trim() && normalizedInstructions.length > 0),
    verification: verificationJsonValid,
    launch: Boolean(values.status && (values.rewardXp > 0 || values.timer?.trim() || values.startsAt || values.endsAt)),
  };

  const warningItems = useMemo(
    () => [
      ...readinessItems
        .filter((item) => !item.complete)
        .map((item) => ({
          label: item.label,
          description: item.value,
          tone: "warning" as const,
        })),
      ...launchWarnings.filter((warning) => warning.tone !== "success"),
    ].filter(
      (item, index, list) => list.findIndex((candidate) => candidate.label === item.label) === index
    ),
    [launchWarnings, readinessItems]
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

    const hasSelectedCampaign = filteredCampaigns.some((campaign) => campaign.id === values.campaignId);
    if (!hasSelectedCampaign) {
      setValues((current) => ({
        ...current,
        campaignId: filteredCampaigns[0]?.id || "",
      }));
    }
  }, [filteredCampaigns, values.campaignId]);

  function updateInstruction(index: number, nextValue: string) {
    const next = [...values.instructions];
    next[index] = nextValue;
    setValues((current) => ({ ...current, instructions: next }));
  }

  function addInstruction() {
    setValues((current) => ({ ...current, instructions: [...current.instructions, ""] }));
  }

  function removeInstruction(index: number) {
    setValues((current) => {
      const next = current.instructions.filter((_, instructionIndex) => instructionIndex !== index);
      return {
        ...current,
        instructions: next.length ? next : [""],
      };
    });
  }

  function validateStep(step: RaidBuilderStepId) {
    if (step === "action" && !(values.title.trim() && values.community.trim() && values.target.trim())) {
      return "Set the raid title, community and pressure objective before continuing.";
    }

    if (
      step === "placement" &&
      !(values.projectId && values.campaignId && values.targetUrl?.trim() && normalizedInstructions.length > 0)
    ) {
      return "Connect the campaign lane, destination URL and contributor steps before continuing.";
    }

    if (step === "verification" && !verificationJsonValid) {
      return "Fix the verification JSON before continuing.";
    }

    return null;
  }

  function attemptStepNavigation(targetStep: RaidBuilderStepId) {
    const targetIndex = raidBuilderSteps.findIndex((step) => step.id === targetStep);

    if (targetIndex <= currentStepIndex) {
      setCurrentStep(targetStep);
      setStepError(null);
      return;
    }

    for (let index = currentStepIndex; index < targetIndex; index += 1) {
      const step = raidBuilderSteps[index];
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
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setSubmitError(null);

        try {
          await onSubmit({
            ...values,
            instructions: normalizedInstructions,
          });
        } catch (error: any) {
          setSubmitError(error?.message || "Failed to save raid.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <StudioShell
        eyebrow="Raid Studio"
        title="Shape the pressure wave before you ship the alert"
        description="A raid should feel like one clean pressure mission. Place it in the right campaign lane, make the proof route obvious, then tune urgency and reward without falling back to a long ops form."
        progressPercent={progressPercent}
        steps={raidBuilderSteps.map((step, index) => ({
          ...step,
          eyebrow: `Step ${index + 1}`,
          complete: stepCompletion[step.id],
        }))}
        currentStep={currentStep}
        onSelectStep={attemptStepNavigation}
        topFrame={
          <StudioTopFrame
            eyebrow="Raid Studio"
            title="Build a pressure mission, not a loose raid alert"
            description="Use the studio to keep action, destination, verification and urgency in one clean launch flow. The member preview stays in sight so the raid feels intentional before it goes live."
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
                <ContextPill value={selectedProject?.name || "No workspace"} tone="default" />
                <ContextPill value={selectedCampaign?.title || "No campaign"} tone="default" />
                <ContextPill value={values.platform} tone="accent" />
                <ContextPill value={values.status} tone={values.status === "active" ? "accent" : "warning"} />
              </div>
            }
            supporting={
              <div className="grid gap-3 sm:grid-cols-3">
                <BuilderMetricCard
                  label="Destination"
                  value={values.targetUrl?.trim() ? "Routed" : "Missing"}
                  sublabel="Target URL"
                />
                <BuilderMetricCard
                  label="Steps"
                  value={`${normalizedInstructions.length}`}
                  sublabel="Contributor instructions"
                />
                <BuilderMetricCard
                  label="Verification"
                  value={verificationJsonValid ? "Stable" : "Needs fix"}
                  sublabel={values.verificationType.replace(/_/g, " ")}
                />
              </div>
            }
          />
        }
        leftRail={
          <StudioStepRail
            steps={raidBuilderSteps.map((step, index) => ({
              id: step.id,
              label: step.label,
              shortLabel: String(index + 1),
              complete:
                stepCompletion[step.id] &&
                raidBuilderSteps.findIndex((candidate) => candidate.id === step.id) < currentStepIndex,
            }))}
            currentStep={currentStep}
            onSelect={attemptStepNavigation}
          />
        }
        rightRail={
          <>
            <StudioPreviewCard
              title="Member-facing raid card"
              eyebrow="Raid preview"
              description="Keep the member view in sight while you shape pressure, proof and urgency."
            >
              <RaidMemberPreview preview={memberPreview} />
            </StudioPreviewCard>

            {currentStep === "verification" ? (
              <StudioPreviewCard
                title="Verification posture"
                eyebrow="Trust rail"
                description="The proof route should feel as deliberate as the CTA."
              >
                <RaidVerificationRail
                  verificationType={values.verificationType}
                  verificationConfig={values.verificationConfig}
                  platform={values.platform}
                />
              </StudioPreviewCard>
            ) : null}

            <StudioWarningRail
              title="Raid watchlist"
              eyebrow="Readiness"
              emptyState="No blockers right now. This raid is stable enough for the next studio step."
              items={warningItems}
            />
          </>
        }
      >
        <div className="space-y-6">
          <BuilderStepHeader
            eyebrow={`Step ${currentStepIndex + 1}`}
            title={currentStepMeta.label}
            description={currentStepMeta.description}
            stepIndex={currentStepIndex + 1}
            totalSteps={raidBuilderSteps.length}
          />

          {stepError ? (
            <div className="rounded-[22px] border border-amber-400/16 bg-amber-500/10 px-4 py-4 text-sm leading-6 text-amber-200">
              {stepError}
            </div>
          ) : null}

          {submitError ? (
            <div className="rounded-[22px] border border-rose-400/16 bg-rose-500/10 px-4 py-4 text-sm leading-6 text-rose-200">
              {submitError}
            </div>
          ) : null}

          {currentStep === "action" ? (
            <RaidActionCanvas
              title="Define the wave"
              description="This is the member-facing core. Make the raid title, community and objective feel like one sharp coordinated move."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Raid title">
                  <input
                    value={values.title}
                    onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
                    className={getInputClassName()}
                    placeholder="Chainwars launch wave"
                  />
                </Field>

                <Field label="Community">
                  <input
                    value={values.community}
                    onChange={(event) => setValues((current) => ({ ...current, community: event.target.value }))}
                    className={getInputClassName()}
                    placeholder="Chainwars raiders"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Short description">
                    <input
                      value={values.shortDescription || ""}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, shortDescription: event.target.value }))
                      }
                      className={getInputClassName()}
                      placeholder="Push the launch harder with one coordinated wave."
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Pressure objective">
                    <textarea
                      value={values.target}
                      onChange={(event) => setValues((current) => ({ ...current, target: event.target.value }))}
                      rows={4}
                      className={getInputClassName()}
                      placeholder="Like, repost and drop a comment on the launch post."
                    />
                  </Field>
                </div>

                {builderMode === "advanced" ? (
                  <div className="md:col-span-2">
                    <Field label="Banner URL">
                      <input
                        value={values.banner || ""}
                        onChange={(event) => setValues((current) => ({ ...current, banner: event.target.value }))}
                        className={getInputClassName()}
                        placeholder="https://..."
                      />
                    </Field>
                  </div>
                ) : null}
              </div>

              <StudioHint>
                Make the objective read like the exact member action, not like an internal ops note.
              </StudioHint>
            </RaidActionCanvas>
          ) : null}

          {currentStep === "placement" ? (
            <RaidActionCanvas
              title="Place the raid in the right lane"
              description="Attach the raid to one real campaign lane, then wire the destination and contributor steps so the wave can actually land."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Project">
                  <select
                    value={values.projectId}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        projectId: event.target.value,
                        campaignId: "",
                      }))
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
                    onChange={(event) => setValues((current) => ({ ...current, campaignId: event.target.value }))}
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

                <Field label="Platform">
                  <select
                    value={values.platform}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        platform: event.target.value as AdminRaid["platform"],
                      }))
                    }
                    className={getInputClassName()}
                  >
                    {PLATFORM_OPTIONS.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Target URL">
                  <input
                    value={values.targetUrl || ""}
                    onChange={(event) => setValues((current) => ({ ...current, targetUrl: event.target.value }))}
                    className={getInputClassName()}
                    placeholder="https://..."
                  />
                </Field>

                {builderMode === "advanced" ? (
                  <>
                    <Field label="Target post ID">
                      <input
                        value={values.targetPostId || ""}
                        onChange={(event) =>
                          setValues((current) => ({ ...current, targetPostId: event.target.value }))
                        }
                        className={getInputClassName()}
                        placeholder="1889272727"
                      />
                    </Field>

                    <Field label="Target account handle">
                      <input
                        value={values.targetAccountHandle || ""}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            targetAccountHandle: event.target.value,
                          }))
                        }
                        className={getInputClassName()}
                        placeholder="@veltrixapp"
                      />
                    </Field>
                  </>
                ) : null}
              </div>

              <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary">
                      Contributor steps
                    </p>
                    <p className="mt-1.5 text-[12px] leading-5 text-sub">
                      Raids need guided steps so the pressure wave feels coordinated instead of vague.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addInstruction}
                    className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[12px] font-bold text-text transition hover:border-primary/25 hover:bg-white/[0.04]"
                  >
                    Add step
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {values.instructions.map((instruction, index) => (
                    <div key={`${index}-${instruction}`} className="flex gap-2.5">
                      <input
                        value={instruction}
                        onChange={(event) => updateInstruction(index, event.target.value)}
                        className={`${getInputClassName()} flex-1`}
                        placeholder={`Step ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeInstruction(index)}
                        className="rounded-[14px] border border-rose-500/24 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-300 transition hover:border-rose-400/40"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </RaidActionCanvas>
          ) : null}

          {currentStep === "verification" ? (
            <RaidActionCanvas
              title="Make the proof route trustworthy"
              description="A raid should not feel manually brittle unless you intend it to. Pick the cleanest verification route and give it enough structure."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Verification type">
                  <select
                    value={values.verificationType}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        verificationType: event.target.value as AdminRaid["verificationType"],
                      }))
                    }
                    className={getInputClassName()}
                  >
                    {VERIFICATION_OPTIONS.map((verificationType) => (
                      <option key={verificationType} value={verificationType}>
                        {verificationType}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="rounded-[14px] border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sub">
                    Recommended posture
                  </p>
                  <p className="mt-1.5 text-[12px] leading-5 text-text">
                    {values.verificationType === "manual_confirm"
                      ? "Best for captain-led waves or custom proof review."
                      : "Use exact destination data and structured JSON so the automation layer can trust the signal."}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Field label="Verification config (JSON)">
                    <textarea
                      value={values.verificationConfig || ""}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          verificationConfig: event.target.value,
                        }))
                      }
                      rows={6}
                      className={getInputClassName()}
                      placeholder='{"targetUrl":"https://x.com/...","handle":"@veltrixapp"}'
                    />
                  </Field>
                </div>
              </div>

              <RaidVerificationRail
                verificationType={values.verificationType}
                verificationConfig={values.verificationConfig}
                platform={values.platform}
              />
            </RaidActionCanvas>
          ) : null}

          {currentStep === "launch" ? (
            <RaidActionCanvas
              title="Tune urgency and reward"
              description="This is where the raid becomes a live operating move. Set XP, urgency and timing so the launch posture matches the pressure you want."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Reward XP">
                  <input
                    type="number"
                    min={0}
                    value={values.rewardXp}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        rewardXp: Number(event.target.value || 0),
                      }))
                    }
                    className={getInputClassName()}
                  />
                </Field>

                <Field label="Timer text">
                  <input
                    value={values.timer || ""}
                    onChange={(event) => setValues((current) => ({ ...current, timer: event.target.value }))}
                    className={getInputClassName()}
                    placeholder="18m left"
                  />
                </Field>

                {builderMode === "advanced" ? (
                  <>
                    <Field label="Participants">
                      <input
                        type="number"
                        min={0}
                        value={values.participants}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            participants: Number(event.target.value || 0),
                          }))
                        }
                        className={getInputClassName()}
                      />
                    </Field>

                    <Field label="Progress %">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={values.progress}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            progress: Number(event.target.value || 0),
                          }))
                        }
                        className={getInputClassName()}
                      />
                    </Field>
                  </>
                ) : null}

                <Field label="Starts at">
                  <input
                    type="datetime-local"
                    value={values.startsAt || ""}
                    onChange={(event) => setValues((current) => ({ ...current, startsAt: event.target.value }))}
                    className={getInputClassName()}
                  />
                </Field>

                <Field label="Ends at">
                  <input
                    type="datetime-local"
                    value={values.endsAt || ""}
                    onChange={(event) => setValues((current) => ({ ...current, endsAt: event.target.value }))}
                    className={getInputClassName()}
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={values.status}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        status: event.target.value as AdminRaid["status"],
                      }))
                    }
                    className={getInputClassName()}
                  >
                    <option value="draft">draft</option>
                    <option value="scheduled">scheduled</option>
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="ended">ended</option>
                  </select>
                </Field>
              </div>

              <RaidLaunchRail
                rewardXp={values.rewardXp}
                timer={values.timer}
                status={values.status}
                warnings={launchWarnings}
              />
            </RaidActionCanvas>
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

function ContextPill({
  value,
  tone,
}: {
  value: string;
  tone: "default" | "accent" | "warning";
}) {
  const toneClass =
    tone === "accent"
      ? "border-primary/20 bg-primary/12 text-primary"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
        : "border-white/[0.04] bg-black/20 text-text";

  return (
    <span className={`rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${toneClass}`}>
      {value}
    </span>
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
      <span className="mb-2 block text-[12px] font-semibold tracking-[-0.01em] text-text">
        {label}
      </span>
      {children}
    </label>
  );
}

function StudioHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] p-3.5 text-[12px] leading-5 text-sub">
      <span className="font-semibold text-text">Studio hint:</span> {children}
    </div>
  );
}

function getInputClassName() {
  return "w-full rounded-[14px] border border-white/[0.04] bg-black/20 px-3 py-2.5 text-[12px] outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15";
}

function isValidJson(raw: string | undefined) {
  if (!raw?.trim()) {
    return true;
  }

  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}
