"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileWarning,
  Layers3,
  ListChecks,
  Route,
  Sparkles,
} from "lucide-react";
import {
  BuilderBottomNav,
  BuilderMetricCard,
  BuilderSidebarCard,
  BuilderStepHeader,
} from "@/components/layout/builder/BuilderPrimitives";
import CampaignIntentStep from "@/components/forms/campaign/CampaignIntentStep";
import CampaignLaunchPreview from "@/components/forms/campaign/CampaignLaunchPreview";
import CampaignMissionMap from "@/components/forms/campaign/CampaignMissionMap";
import CampaignStoryboardCanvas from "@/components/forms/campaign/CampaignStoryboardCanvas";
import CampaignStoryboardInspector from "@/components/forms/campaign/CampaignStoryboardInspector";
import StudioEntryCommandDeck from "@/components/forms/studio/StudioEntryCommandDeck";
import StudioModeToggle from "@/components/forms/studio/StudioModeToggle";
import StudioShell from "@/components/forms/studio/StudioShell";
import StudioStepRail from "@/components/forms/studio/StudioStepRail";
import StudioTopFrame from "@/components/forms/studio/StudioTopFrame";
import AdminShell from "@/components/layout/shell/AdminShell";
import CampaignForm from "@/components/forms/campaign/CampaignForm";
import { XpValue, isXpDisplay } from "@/components/ui/XpBadge";
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
import {
  CampaignStudioAudienceId,
  CampaignStudioIntentId,
  type CampaignMissionMapItem,
  getCampaignLaunchPreview,
  getCampaignMissionMap,
  getCampaignStudioCompactReadiness,
  getCampaignStudioIntentState,
} from "@/lib/studio/campaign-studio";
import {
  type CampaignStoryboardBlockId,
  getCampaignStoryboard,
  getCampaignStoryboardBlock,
  getCampaignStoryboardWarnings,
} from "@/lib/studio/campaign-storyboard";
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

type SelectedTemplateId = CampaignTemplateId | null;
type BuilderStepId = "template" | "custom" | "autofill" | "flow" | "launch";

const baseBuilderSteps: Array<{
  id: BuilderStepId;
  label: string;
  description: string;
}> = [
  {
    id: "template",
    label: "Playbook",
    description: "Choose the full campaign template or a saved project variant that fits this workspace best.",
  },
  {
    id: "custom",
    label: "Custom path",
    description: "Define the direction for a custom campaign path before you continue into setup and launch.",
  },
  {
    id: "autofill",
    label: "Context",
    description: "See what Veltrix can autofill already and patch the missing project context inline.",
  },
  {
    id: "flow",
    label: "Storyboard",
    description: "Review the generated quests and rewards, then include, skip, or refine the drafts.",
  },
  {
    id: "launch",
    label: "Launch",
    description: "Save this setup as a reusable template variant and generate the campaign when it feels right.",
  },
];

type CampaignStudioWatchItem = {
  label: string;
  description: string;
  tone?: "default" | "warning" | "success";
};

type CampaignLaunchPreviewModel = ReturnType<typeof getCampaignLaunchPreview>;

function CampaignPlaybookCommandSurface({
  projectName,
  selectedTemplate,
  templateCount,
  savedTemplateCount,
  intentLabel,
  audienceLabel,
}: {
  projectName: string;
  selectedTemplate?: CampaignTemplateOption | null;
  templateCount: number;
  savedTemplateCount: number;
  intentLabel: string;
  audienceLabel: string;
}) {
  const fitLabel = selectedTemplate
    ? `${selectedTemplate.fitLabel} (${selectedTemplate.fitScore}/100)`
    : "Choose playbook";

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-white/[0.026] bg-[radial-gradient(circle_at_4%_0%,rgba(199,255,0,0.07),transparent_30%),radial-gradient(circle_at_92%_8%,rgba(88,146,255,0.045),transparent_25%),linear-gradient(180deg,rgba(13,16,23,0.985),rgba(8,10,15,0.965))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/[0.14] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            <Layers3 size={12} />
            Playbook command
          </p>
          <h3 className="mt-3 text-[1.08rem] font-semibold tracking-[-0.03em] text-text md:text-[1.24rem]">
            Pick the campaign system before anything gets wired
          </h3>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-sub">
            The selected playbook decides the first quests, reward posture and launch route. Keep this step clear so onboarding teams understand the decision.
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${
            selectedTemplate ? "bg-primary/[0.08] text-primary" : "bg-amber-500/[0.09] text-amber-300"
          }`}
        >
          {selectedTemplate ? <BadgeCheck size={13} /> : <FileWarning size={13} />}
          {fitLabel}
        </span>
      </div>

      <div className="relative mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <PlaybookCommandMetric label="Project" value={projectName} />
        <PlaybookCommandMetric label="Intent" value={intentLabel} />
        <PlaybookCommandMetric label="Audience" value={audienceLabel} />
        <PlaybookCommandMetric label="Options" value={templateCount} />
        <PlaybookCommandMetric label="Saved" value={savedTemplateCount} />
      </div>
    </section>
  );
}

function PlaybookCommandMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-white/[0.022] bg-black/25 px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 truncate text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}

function CampaignLaunchCommandSurface({
  preview,
  projectName,
  templateLabel,
  questCount,
  rewardCount,
  missingContextCount,
  editedDraftCount,
  savedTemplateName,
  savedTemplateDescription,
  onSavedTemplateNameChange,
  onSavedTemplateDescriptionChange,
  onSaveVariant,
  savingTemplate,
  canSaveVariant,
  savedTemplateMessage,
  generationMessage,
}: {
  preview: CampaignLaunchPreviewModel;
  projectName: string;
  templateLabel: string;
  questCount: number;
  rewardCount: number;
  missingContextCount: number;
  editedDraftCount: number;
  savedTemplateName: string;
  savedTemplateDescription: string;
  onSavedTemplateNameChange: (value: string) => void;
  onSavedTemplateDescriptionChange: (value: string) => void;
  onSaveVariant: () => void;
  savingTemplate: boolean;
  canSaveVariant: boolean;
  savedTemplateMessage: string | null;
  generationMessage: string | null;
}) {
  const readyCount = preview.readiness.filter((item) => item.complete).length;
  const readinessPercent = Math.round(
    (readyCount / Math.max(preview.readiness.length, 1)) * 100
  );
  const launchTone =
    missingContextCount > 0
      ? "Context watch"
      : questCount > 0 && rewardCount > 0
        ? "Ready to generate"
        : "Drafting";

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-white/[0.026] bg-[radial-gradient(circle_at_3%_0%,rgba(199,255,0,0.07),transparent_30%),radial-gradient(circle_at_92%_10%,rgba(88,146,255,0.045),transparent_25%),linear-gradient(180deg,rgba(13,16,23,0.985),rgba(8,10,15,0.965))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]" />
      <div className="relative grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-[18px] border border-white/[0.026] bg-black/20 p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/[0.14] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                <Sparkles size={12} />
                Launch command
              </p>
              <h3 className="mt-3 text-[1.08rem] font-semibold tracking-[-0.03em] text-text md:text-[1.24rem]">
                Generate the campaign from a locked mission lane
              </h3>
              <p className="mt-2 max-w-3xl text-[12px] leading-5 text-sub">
                Finalize timing, media and campaign signals here. The quest and reward lanes stay attached when the campaign is generated.
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${
                missingContextCount > 0
                  ? "bg-amber-500/[0.09] text-amber-300"
                  : "bg-primary/[0.08] text-primary"
              }`}
            >
              {missingContextCount > 0 ? <FileWarning size={13} /> : <BadgeCheck size={13} />}
              {launchTone}
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <LaunchCommandMetric label="Project" value={projectName} />
            <LaunchCommandMetric label="Playbook" value={templateLabel} />
            <LaunchCommandMetric label="Quests" value={questCount} />
            <LaunchCommandMetric label="Rewards" value={rewardCount} />
          </div>

          <div className="mt-3 rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                  Launch pressure
                </p>
                <p className="mt-1.5 text-[12px] font-semibold text-text">
                  {readyCount}/{preview.readiness.length} readiness checks clear
                </p>
              </div>
              <span className="rounded-full border border-white/[0.026] bg-black/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-primary">
                {readinessPercent}%
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/35">
              <div
                className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(199,255,0,0.3)]"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <LaunchCommandSignal label="First moment" value={preview.firstMemberMoment} />
              <LaunchCommandSignal label="Missing" value={missingContextCount} />
              <LaunchCommandSignal label="Edited drafts" value={editedDraftCount} />
            </div>
          </div>

          {generationMessage ? (
            <div className="mt-3 flex items-center gap-2.5 rounded-[16px] border border-primary/20 bg-primary/[0.055] px-3.5 py-3 text-[12px] font-semibold text-primary">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{generationMessage}</span>
            </div>
          ) : null}
        </div>

        <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.014] p-3.5">
          <div className="flex items-center gap-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              Save variant
            </p>
            <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.13),transparent)]" />
          </div>
          <div className="mt-3 space-y-2.5">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                Template name
              </span>
              <input
                value={savedTemplateName}
                onChange={(event) => onSavedTemplateNameChange(event.target.value)}
                className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm outline-none transition focus:border-primary/25"
                placeholder="Chainwars launch variant"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                Short note
              </span>
              <input
                value={savedTemplateDescription}
                onChange={(event) => onSavedTemplateDescriptionChange(event.target.value)}
                className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm outline-none transition focus:border-primary/25"
                placeholder="For launch pushes with quote-post proof"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={onSaveVariant}
            disabled={!canSaveVariant || savingTemplate}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-white/[0.04] bg-white/[0.035] px-3.5 py-3 text-[10px] font-black uppercase tracking-[0.13em] text-text transition hover:-translate-y-0.5 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {savingTemplate ? "Saving variant..." : "Save project variant"}
            <ArrowRight size={13} />
          </button>
          {savedTemplateMessage ? (
            <p className="mt-2.5 rounded-[14px] border border-primary/[0.14] bg-primary/[0.045] px-3 py-2 text-[11px] leading-5 text-primary">
              {savedTemplateMessage}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function LaunchCommandMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-white/[0.022] bg-black/25 px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 truncate text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}

function LaunchCommandSignal({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-white/[0.022] bg-black/20 px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 truncate text-[11px] font-semibold text-text">{value}</p>
    </div>
  );
}

function CampaignStudioSideDock({
  currentStepLabel,
  progressPercent,
  actionLabel,
  onAction,
  projectName,
  templateLabel,
  templateFit,
  questCount,
  rewardCount,
  missingContextCount,
  editedDraftCount,
  audienceLabel,
  missionItems,
  watchItems,
}: {
  currentStepLabel: string;
  progressPercent: number;
  actionLabel: string;
  onAction?: () => void;
  projectName: string;
  templateLabel: string;
  templateFit: string;
  questCount: string;
  rewardCount: string;
  missingContextCount: number;
  editedDraftCount: number;
  audienceLabel: string;
  missionItems: CampaignMissionMapItem[];
  watchItems: CampaignStudioWatchItem[];
}) {
  const visibleWatchItems = watchItems.slice(0, 3);
  const visibleMissionItems = missionItems.slice(0, 4);
  const warningCount = watchItems.filter((item) => item.tone === "warning").length;

  return (
    <div className="space-y-3">
      <section className="relative overflow-hidden rounded-[18px] border border-primary/[0.12] bg-[radial-gradient(circle_at_top_right,rgba(199,255,0,0.08),transparent_34%),linear-gradient(180deg,rgba(16,21,27,0.98),rgba(8,10,15,0.96))] p-3.5 shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)]" />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Ready to build
          </p>
          <BadgeCheck size={15} className="text-primary" />
        </div>
        <p className="mt-3 text-[0.98rem] font-semibold tracking-[-0.02em] text-text">
          {currentStepLabel}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/35">
          <div
            className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(199,255,0,0.32)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-3 grid gap-2">
          <CampaignDockSignal icon={<Sparkles size={13} />} label="Project" value={projectName} />
          <CampaignDockSignal icon={<Route size={13} />} label="Playbook" value={templateLabel} />
          <CampaignDockSignal icon={<CheckCircle2 size={13} />} label="Fit" value={templateFit} />
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={!onAction}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-primary px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.13em] text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {actionLabel}
          <ArrowRight size={13} />
        </button>
      </section>

      <section className="rounded-[18px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(13,17,24,0.97),rgba(8,10,15,0.95))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
        <div className="flex items-center gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Campaign recipe
          </p>
          <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.13),transparent)]" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <CampaignDockMetric label="Quests" value={questCount} />
          <CampaignDockMetric label="Rewards" value={rewardCount} />
          <CampaignDockMetric label="Missing" value={missingContextCount} />
          <CampaignDockMetric label="Edits" value={editedDraftCount} />
        </div>
        <CampaignDockSignal
          className="mt-2"
          icon={<ListChecks size={13} />}
          label="Audience"
          value={audienceLabel}
        />
      </section>

      <section className="rounded-[18px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(13,17,24,0.97),rgba(8,10,15,0.95))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Mission map
          </p>
          <span className="rounded-full border border-white/[0.026] bg-black/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-sub">
            {missionItems.length} blocks
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {visibleMissionItems.length > 0 ? (
            visibleMissionItems.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-[28px_minmax(0,1fr)] gap-2 rounded-[14px] border border-white/[0.022] bg-white/[0.014] p-2.5"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black ${
                    item.status === "ready"
                      ? "border-primary/20 bg-primary/[0.055] text-primary"
                      : item.status === "needs_context"
                        ? "border-amber-400/20 bg-amber-500/[0.08] text-amber-300"
                        : "border-white/[0.032] bg-black/20 text-sub"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-text">{item.title}</p>
                  <p className="mt-1 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-sub">
                    {item.kind.replace(/_/g, " ")} · {item.status.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[14px] border border-white/[0.022] bg-white/[0.014] p-3 text-[11px] leading-5 text-sub">
              Pick a playbook to unlock a compact mission route.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[18px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(13,17,24,0.97),rgba(8,10,15,0.95))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            Watchlist
          </p>
          <span className="rounded-full border border-white/[0.026] bg-black/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-sub">
            {warningCount > 0 ? `${warningCount} watch` : "stable"}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {visibleWatchItems.length > 0 ? (
            visibleWatchItems.map((item) => (
              <div
                key={item.label}
                className={`rounded-[14px] border p-2.5 ${
                  item.tone === "warning"
                    ? "border-amber-400/[0.16] bg-amber-500/[0.055]"
                    : item.tone === "success"
                      ? "border-primary/[0.14] bg-primary/[0.045]"
                      : "border-white/[0.022] bg-white/[0.014]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileWarning
                    size={12}
                    className={item.tone === "warning" ? "text-amber-300" : "text-primary"}
                  />
                  <p className="truncate text-[11px] font-bold text-text">{item.label}</p>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-sub">
                  {item.description}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-[14px] border border-primary/[0.14] bg-primary/[0.045] p-3 text-[11px] leading-5 text-primary">
              No blockers on this step. Continue when the campaign shape feels right.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function CampaignDockSignal({
  icon,
  label,
  value,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 rounded-[14px] border border-white/[0.022] bg-white/[0.014] px-3 py-2.5 ${className}`.trim()}
    >
      <span className="shrink-0 text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
        <p className="mt-1 truncate text-[11px] font-semibold text-text">{value}</p>
      </div>
    </div>
  );
}

function CampaignDockMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[14px] border border-white/[0.022] bg-white/[0.014] px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 text-[0.96rem] font-semibold tracking-[-0.02em] text-text">
        {value}
      </p>
    </div>
  );
}

function NewCampaignPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const setActiveProjectId = useAdminAuthStore((s) => s.setActiveProjectId);
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
  const requestedProjectId = searchParams.get("projectId") || undefined;
  const requestedTemplateId = searchParams.get("templateId") || undefined;
  const requestedSavedTemplateId = searchParams.get("savedTemplateId") || undefined;
  const entrySource = searchParams.get("source") || "direct";

  const [selectedTemplateId, setSelectedTemplateId] =
    useState<SelectedTemplateId>(null);
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
  const [generatedCampaign, setGeneratedCampaign] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [customPlaybookSummary, setCustomPlaybookSummary] = useState("");
  const [customPlaybookGoal, setCustomPlaybookGoal] = useState("");
  const [expandedQuestKeys, setExpandedQuestKeys] = useState<string[]>([]);
  const [expandedRewardKeys, setExpandedRewardKeys] = useState<string[]>([]);
  const [studioLens, setStudioLens] = useState<"strategy" | "launch">("strategy");
  const [selectedIntent, setSelectedIntent] = useState<CampaignStudioIntentId>("hybrid_launch");
  const [selectedAudience, setSelectedAudience] = useState<CampaignStudioAudienceId>("mixed");
  const [selectedStoryboardBlockId, setSelectedStoryboardBlockId] =
    useState<CampaignStoryboardBlockId>("goal");
  const [searchSeedApplied, setSearchSeedApplied] = useState(false);

  const selectedProject = useMemo(
    () =>
      projects.find((project) => project.id === (requestedProjectId || activeProjectId)) ??
      projects[0] ??
      null,
    [activeProjectId, projects, requestedProjectId]
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
  const entrySourceLabel =
    entrySource === "launch"
      ? "Launch Workspace"
      : entrySource === "campaign-board"
        ? "Campaign Board"
        : entrySource === "project-overview"
          ? "Project Overview"
          : undefined;
  const returnHref =
    selectedProject?.id && entrySource === "launch"
      ? `/projects/${selectedProject.id}/launch`
      : selectedProject?.id && entrySource === "campaign-board"
        ? `/projects/${selectedProject.id}/campaigns`
        : selectedProject?.id && entrySource === "project-overview"
          ? `/projects/${selectedProject.id}`
          : null;

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
      effectiveProject && selectedTemplateId
        ? buildCampaignTemplate(effectiveProject, selectedTemplateId)
        : null,
    [effectiveProject, selectedTemplateId]
  );
  const persistedTemplatePlan = useMemo(
    () =>
      selectedProject && selectedTemplateId
        ? buildCampaignTemplate(selectedProject, selectedTemplateId)
        : null,
    [selectedProject, selectedTemplateId]
  );

  const selectedTemplate = templateOptions.find(
    (template) => template.id === selectedTemplateId
  );
  const inferredIntentState = useMemo(
    () => getCampaignStudioIntentState({ selectedTemplate }),
    [selectedTemplate]
  );
  const featuredTemplate = templateOptions[0] ?? null;
  const secondaryTemplates = templateOptions.filter(
    (template) => template.id !== featuredTemplate?.id
  );
  const builderSteps = useMemo(
    () =>
      baseBuilderSteps.filter((step) =>
        selectedTemplateId === "blank_campaign_canvas" ? true : step.id !== "custom"
      ),
    [selectedTemplateId]
  );
  const currentStepIndex = builderSteps.findIndex((step) => step.id === currentStep);
  const currentStepMeta = builderSteps[currentStepIndex];
  const previousStep = builderSteps[currentStepIndex - 1];
  const nextStep = builderSteps[currentStepIndex + 1];
  const progressPercent = Math.round(((currentStepIndex + 1) / builderSteps.length) * 100);
  const storyboardStepItems = useMemo(
    () =>
      builderSteps.map((step, index) => ({
        id: step.id,
        label: step.label,
        shortLabel: String(index + 1),
        complete:
          visitedSteps.includes(step.id) &&
          builderSteps.findIndex((item) => item.id === step.id) < currentStepIndex,
      })),
    [builderSteps, currentStepIndex, visitedSteps]
  );

  useEffect(() => {
    if (!requestedProjectId) return;
    const projectExists = projects.some((project) => project.id === requestedProjectId);
    if (projectExists && activeProjectId !== requestedProjectId) {
      setActiveProjectId(requestedProjectId);
    }
  }, [activeProjectId, projects, requestedProjectId, setActiveProjectId]);

  useEffect(() => {
    setVisitedSteps((current) =>
      current.includes(currentStep) ? current : [...current, currentStep]
    );
    setStepError(null);
  }, [currentStep]);

  useEffect(() => {
    if (searchSeedApplied) {
      return;
    }

    if (requestedSavedTemplateId) {
      const savedTemplate = savedProjectTemplates.find(
        (template) => template.id === requestedSavedTemplateId
      );
      if (!savedTemplate) {
        return;
      }

      applySavedTemplate(savedTemplate.configuration);
      setCurrentStep("autofill");
      setSearchSeedApplied(true);
      return;
    }

    if (requestedTemplateId) {
      const hasTemplate = templateOptions.some(
        (template) => template.id === requestedTemplateId
      );
      if (!hasTemplate) {
        return;
      }

      chooseTemplate(requestedTemplateId as CampaignTemplateId);
      setSearchSeedApplied(true);
      return;
    }

    setSearchSeedApplied(true);
  }, [
    requestedSavedTemplateId,
    requestedTemplateId,
    savedProjectTemplates,
    searchSeedApplied,
    templateOptions,
  ]);

  useEffect(() => {
    if (!builderSteps.some((step) => step.id === currentStep)) {
      setCurrentStep("template");
    }
  }, [builderSteps, currentStep]);

  useEffect(() => {
    setProjectContextDraft({});
    setQuestDraftEdits({});
    setRewardDraftEdits({});
    setContextMessage(null);
    setSavedTemplateMessage(null);
    setCustomPlaybookSummary("");
    setCustomPlaybookGoal("");
    setExpandedQuestKeys([]);
    setExpandedRewardKeys([]);
  }, [selectedProject?.id, selectedTemplateId]);

  useEffect(() => {
    setSelectedIntent(inferredIntentState.intentId);
    setSelectedAudience(inferredIntentState.audienceId);
  }, [inferredIntentState.audienceId, inferredIntentState.intentId]);

  useEffect(() => {
    setCampaignTitleDraft(templatePlan?.campaignDraft.title ?? "");
  }, [templatePlan?.campaignDraft.title]);

  useEffect(() => {
    setSelectedQuestKeys(templatePlan?.questDrafts.map((quest) => quest.key) ?? []);
    setSelectedRewardKeys(templatePlan?.rewardDrafts.map((reward) => reward.key) ?? []);
  }, [templatePlan]);

  useEffect(() => {
    if (currentStep === "template" || currentStep === "custom") {
      setSelectedStoryboardBlockId("goal");
      return;
    }

    if (currentStep === "autofill") {
      setSelectedStoryboardBlockId("launch_posture");
      return;
    }

    if (currentStep === "flow") {
      setSelectedStoryboardBlockId("quest_lane");
      return;
    }

    if (currentStep === "launch") {
      setSelectedStoryboardBlockId("launch_posture");
    }
  }, [currentStep]);

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
  const currentMissingContextFields = templatePlan?.missingProjectFields ?? [];
  const persistedMissingContextFields =
    persistedTemplatePlan?.missingProjectFields ?? [];
  const editableContextFields = useMemo(() => {
    const draftKeys = Object.keys(projectContextDraft).filter(
      (key) => key in projectContextDraft
    ) as EditableProjectContextField[];

    return Array.from(
      new Set<EditableProjectContextField>([
        ...(persistedMissingContextFields as EditableProjectContextField[]),
        ...draftKeys,
      ])
    );
  }, [persistedMissingContextFields, projectContextDraft]);
  const missionMap = useMemo(
    () =>
      getCampaignMissionMap({
        project: effectiveProject,
        templatePlan,
        selectedQuestKeys,
        selectedRewardKeys,
      }),
    [effectiveProject, selectedQuestKeys, selectedRewardKeys, templatePlan]
  );
  const launchPreview = useMemo(
    () =>
      getCampaignLaunchPreview({
        project: effectiveProject,
        templatePlan,
        selectedQuestKeys,
        selectedRewardKeys,
      }),
    [effectiveProject, selectedQuestKeys, selectedRewardKeys, templatePlan]
  );
  const compactReadiness = useMemo(
    () =>
      getCampaignStudioCompactReadiness({
        project: effectiveProject,
        templatePlan,
        selectedQuestKeys,
        selectedRewardKeys,
      }),
    [effectiveProject, selectedQuestKeys, selectedRewardKeys, templatePlan]
  );
  const storyboardBlocks = useMemo(
    () =>
      templatePlan && selectedTemplate
        ? getCampaignStoryboard({
            project: effectiveProject,
            templatePlan,
            templateId: selectedTemplate.id,
            selectedQuestKeys,
            selectedRewardKeys,
            intentLabel: inferredIntentState.intent.label,
            audienceLabel: inferredIntentState.audience.label,
          })
        : [],
    [
      effectiveProject,
      inferredIntentState.audience.label,
      inferredIntentState.intent.label,
      selectedQuestKeys,
      selectedRewardKeys,
      selectedTemplate,
      templatePlan,
    ]
  );
  const selectedStoryboardBlock = useMemo(
    () => getCampaignStoryboardBlock(storyboardBlocks, selectedStoryboardBlockId),
    [selectedStoryboardBlockId, storyboardBlocks]
  );
  const storyboardWarnings = useMemo(() => {
    const items = [
      ...getCampaignStoryboardWarnings(storyboardBlocks),
      ...compactReadiness.map((item) => ({
        label: item.label,
        description: item.value,
        tone: "warning" as const,
      })),
    ];

    return items.filter(
      (item, index, list) => list.findIndex((candidate) => candidate.label === item.label) === index
    );
  }, [compactReadiness, storyboardBlocks]);

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
    if (!selectedProject || Object.keys(projectContextDraft).length === 0) {
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

  function chooseTemplate(templateId: CampaignTemplateId) {
    setSelectedTemplateId(templateId);
    setVisitedSteps(["template"]);
    setCurrentStep(templateId === "blank_campaign_canvas" ? "custom" : "autofill");
  }

  function validateCurrentStep(step: BuilderStepId) {
    if (step === "template" && !selectedTemplateId) {
      return "Choose a playbook or blank campaign canvas before continuing.";
    }

    if (
      step === "custom" &&
      selectedTemplateId === "blank_campaign_canvas" &&
      !campaignTitleDraft.trim()
    ) {
      return "Give your custom playbook a campaign title before continuing.";
    }

    if (step === "autofill" && currentMissingContextFields.length > 0) {
      return `Add the missing workspace context first: ${currentMissingContextFields
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

  function renderWorkspaceContextEditor() {
    if (!selectedTemplate) {
      return (
        <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.018] p-5">
          <p className="text-sm leading-7 text-sub">
            Pick a playbook first so Veltrix can show which workspace links and brand fields the
            campaign needs.
          </p>
        </div>
      );
    }

    const patchedContextCount =
      selectedTemplate.requiredProjectFields.length - currentMissingContextFields.length;
    const contextIsClear = currentMissingContextFields.length === 0;

    return (
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-[22px] border border-white/[0.026] bg-[radial-gradient(circle_at_4%_0%,rgba(199,255,0,0.065),transparent_32%),radial-gradient(circle_at_94%_6%,rgba(88,146,255,0.045),transparent_28%),linear-gradient(180deg,rgba(13,16,23,0.98),rgba(8,10,15,0.955))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/[0.14] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                <Route size={12} />
                Context router
              </p>
              <h3 className="mt-3 text-[1.05rem] font-semibold tracking-[-0.03em] text-text md:text-[1.22rem]">
                Patch only the fields this playbook needs
              </h3>
              <p className="mt-2 max-w-3xl text-[12px] leading-5 text-sub">
                Missing workspace data stays in one compact control surface, then gets saved back to the project so future campaigns start cleaner.
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${
                contextIsClear ? "bg-primary/[0.08] text-primary" : "bg-amber-500/[0.09] text-amber-300"
              }`}
            >
              {contextIsClear ? <BadgeCheck size={13} /> : <FileWarning size={13} />}
              {contextIsClear ? "Context clear" : `${currentMissingContextFields.length} missing`}
            </span>
          </div>

          <div className="relative mt-3 grid gap-2 sm:grid-cols-3">
            <PlaybookCommandMetric label="Required" value={selectedTemplate.requiredProjectFields.length} />
            <PlaybookCommandMetric label="Ready" value={patchedContextCount} />
            <PlaybookCommandMetric label="Missing" value={currentMissingContextFields.length} />
          </div>

          <div className="relative mt-3 flex flex-wrap gap-2">
            {selectedTemplate.requiredProjectFields.map((field) => {
              const missing = currentMissingContextFields.includes(field);

              return (
                <span
                  key={field}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${
                    missing
                      ? "border border-amber-400/[0.16] bg-amber-500/[0.07] text-amber-300"
                      : "border border-primary/[0.12] bg-primary/[0.055] text-primary"
                  }`}
                >
                  {missing ? <FileWarning size={12} /> : <CheckCircle2 size={12} />}
                  {formatProjectFieldLabel(field)}
                </span>
              );
            })}
          </div>
        </section>

        {currentMissingContextFields.length > 0 ? (
          <section className="rounded-[20px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(13,16,23,0.96),rgba(8,10,15,0.94))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                  Missing inputs
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-sub">
                  Add these once. The builder refreshes template autofill after save.
                </p>
              </div>
              <span className="rounded-full border border-white/[0.026] bg-black/25 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-sub">
                {editableContextFields.length} fields
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {editableContextFields.map((field) => (
                <label
                  key={field}
                  className="block min-w-0 rounded-[16px] border border-white/[0.026] bg-black/[0.22] p-3.5"
                >
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                    {formatProjectFieldLabel(field)}
                  </span>
                  <input
                    value={
                      projectContextDraft[field as EditableProjectContextField] ??
                      ((selectedProject?.[field as EditableProjectContextField] as string | undefined) ??
                        "")
                    }
                    onChange={(event) =>
                      setProjectContextDraft((current) => ({
                        ...current,
                        [field as EditableProjectContextField]: event.target.value,
                      }))
                    }
                    className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm text-text outline-none transition focus:border-primary/25"
                    placeholder={`Add ${formatProjectFieldLabel(field)}`}
                  />
                </label>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-white/[0.026] bg-black/20 px-3.5 py-3">
              <p className="max-w-2xl text-[12px] leading-5 text-sub">
                Save here updates the selected project context. Campaign generation stays blocked until the required fields are present.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {contextMessage ? <p className="text-[12px] font-semibold text-sub">{contextMessage}</p> : null}
                <button
                  type="button"
                  onClick={saveProjectContextFields}
                  disabled={
                    contextSaving ||
                    !selectedProject ||
                    Object.keys(projectContextDraft).length === 0
                  }
                  className="inline-flex items-center gap-2 rounded-[14px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.13em] text-black shadow-[0_12px_28px_rgba(141,255,89,0.18)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {contextSaving ? "Saving..." : "Save context"}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-[20px] border border-primary/[0.18] bg-[linear-gradient(135deg,rgba(199,255,0,0.09),rgba(255,255,255,0.026))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/[0.08] text-primary">
                  <CheckCircle2 size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.96rem] font-semibold tracking-[-0.02em] text-text">
                    Autofill is ready for this playbook
                  </p>
                  <p className="mt-1.5 text-[12px] leading-5 text-sub">
                    All required workspace fields are present, so the generated journey can use clean routes and project context.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-primary/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-primary">
                ready
              </span>
            </div>
          </section>
        )}

        {contextSections.length > 0 ? (
          <section className="rounded-[20px] border border-white/[0.026] bg-black/[0.18] p-3.5">
            <div className="mb-3 flex items-center gap-3">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                Connected context
              </p>
              <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(199,255,0,0.13),transparent)]" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {contextSections.map((section) => (
                <TemplateMetaCard
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  value={section.value}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  function renderFlowBlockWorkspace() {
    switch (selectedStoryboardBlockId) {
      case "goal":
        return (
          <div className="space-y-5">
            <CampaignIntentStep
              selectedIntent={selectedIntent}
              selectedAudience={selectedAudience}
              onIntentChange={setSelectedIntent}
              onAudienceChange={setSelectedAudience}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <TemplateMeta
                label="Campaign promise"
                value={
                  customPlaybookSummary ||
                  templatePlan?.campaignDraft.shortDescription ||
                  "Shape the promise this campaign should make to contributors."
                }
              />
              <TemplateMeta
                label="Audience posture"
                value={`${inferredIntentState.intent.label} - ${inferredIntentState.audience.label}`}
              />
            </div>
          </div>
        );
      case "quest_lane": {
        const questDrafts = templatePlan?.questDrafts ?? [];
        const readyQuestDrafts = questDrafts.filter(
          (quest) => quest.missingProjectFields.length === 0
        ).length;

        return (
          <div className="space-y-3">
            <TemplateDraftLaneHeader
              eyebrow="First-wave quest lane"
              title="Shape the route members complete first"
              description="Keep the active path tight: include the strongest drafts, edit the exact action, and leave weak steps out before launch."
              metrics={[
                { label: "Included", value: `${includedQuestDrafts.length}/${questDrafts.length}` },
                { label: "Ready", value: readyQuestDrafts },
                { label: "Edited", value: editedQuestCount },
              ]}
            />
            <div className="grid gap-2.5">
              {questDrafts.map((quest, index) => (
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
                  expanded={expandedQuestKeys.includes(quest.key)}
                  onToggle={() =>
                    setSelectedQuestKeys((current) =>
                      current.includes(quest.key)
                        ? current.filter((key) => key !== quest.key)
                        : [...current, quest.key]
                    )
                  }
                  onToggleExpand={() =>
                    setExpandedQuestKeys((current) =>
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
        );
      }
      case "reward_outcome": {
        const rewardDrafts = templatePlan?.rewardDrafts ?? [];

        return (
          <div className="space-y-3">
            <TemplateDraftLaneHeader
              eyebrow="Reward outcome"
              title="Lock the payoff before generation"
              description="Keep the reward layer obvious: include the outcome that explains why the campaign matters and tune the cost before launch."
              metrics={[
                { label: "Included", value: `${includedRewardDrafts.length}/${rewardDrafts.length}` },
                { label: "Ready", value: rewardDrafts.length },
                { label: "Edited", value: editedRewardCount },
              ]}
            />
            <div className="grid gap-2.5">
              {rewardDrafts.map((reward, index) => (
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
                  index={index}
                  expanded={expandedRewardKeys.includes(reward.key)}
                  onToggle={() =>
                    setSelectedRewardKeys((current) =>
                      current.includes(reward.key)
                        ? current.filter((key) => key !== reward.key)
                        : [...current, reward.key]
                    )
                  }
                  onToggleExpand={() =>
                    setExpandedRewardKeys((current) =>
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
        );
      }
      case "raid_pressure":
        return (
          <div className="space-y-5">
            <div className="rounded-[18px] border border-amber-400/20 bg-amber-500/[0.06] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-300">
                Raid layer
              </p>
              <p className="mt-3 text-sm leading-7 text-amber-100">
                This campaign does not create the raid itself here. Instead, use this block to
                decide whether the campaign needs a pressure wave and whether the launch timing is
                strong enough to support it.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TemplateMeta
                label="Current posture"
                value={
                  selectedTemplate?.id === "social_raid_push"
                    ? "Raid-led launch pressure is expected."
                    : "Raids stay optional until the campaign proves it needs urgency."
                }
              />
              <TemplateMeta
                label="Next move"
                value="Generate the campaign first, then add a dedicated raid if you want live pressure on top of the quest lane."
              />
            </div>
          </div>
        );
      case "launch_posture":
        return (
          <div className="space-y-5">
            <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.018] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Launch watch
              </p>
              <p className="mt-3 text-sm leading-7 text-sub">
                This block keeps the workspace context, mission map and launch posture visible
                before you move into final generation.
              </p>
            </div>
            <BuilderSidebarCard title="Mission map">
              <CampaignMissionMap items={missionMap} />
            </BuilderSidebarCard>
            <BuilderSidebarCard title="Launch preview">
              <CampaignLaunchPreview preview={launchPreview} />
            </BuilderSidebarCard>
          </div>
        );
      default:
        return null;
    }
  }

  function renderFlowInspectorChildren() {
    if (!selectedStoryboardBlock) return null;

    if (selectedStoryboardBlockId === "quest_lane") {
      return (
        <div className="space-y-3">
          <TemplateMeta
            label="Included quests"
            value={`${includedQuestDrafts.length} of ${templatePlan?.questDrafts.length ?? 0} drafts are active in the first wave.`}
          />
          <TemplateMeta
            label="First member moment"
            value={includedQuestDrafts[0]?.draft.title || "No first-wave quest selected yet."}
          />
        </div>
      );
    }

    if (selectedStoryboardBlockId === "reward_outcome") {
      return (
        <div className="space-y-3">
          <TemplateMeta
            label="Included rewards"
            value={`${includedRewardDrafts.length} of ${templatePlan?.rewardDrafts.length ?? 0} drafts are active in the payoff layer.`}
          />
          <TemplateMeta
            label="Primary payoff"
            value={includedRewardDrafts[0]?.draft.title || "No reward outcome selected yet."}
          />
        </div>
      );
    }

    if (selectedStoryboardBlockId === "launch_posture") {
      return <CampaignLaunchPreview preview={launchPreview} />;
    }

    return (
      <div className="space-y-3">
        <TemplateMeta label="Intent" value={inferredIntentState.intent.label} />
        <TemplateMeta label="Audience" value={inferredIntentState.audience.label} />
      </div>
    );
  }

  function renderStudioCore() {
    if (currentStep === "template") {
      return (
        <div className="space-y-4">
          <BuilderStepHeader
            eyebrow={`Step ${currentStepIndex + 1}`}
            title="Start from a complete playbook"
            description="Pick the campaign system that fits this workspace best. Veltrix scores templates against your project context so teams can move fast without building from scratch."
            stepIndex={currentStepIndex + 1}
            totalSteps={builderSteps.length}
          />

          <CampaignPlaybookCommandSurface
            projectName={selectedProject?.name || "No project"}
            selectedTemplate={selectedTemplate}
            templateCount={templateOptions.length}
            savedTemplateCount={savedProjectTemplates.length}
            intentLabel={inferredIntentState.intent.label}
            audienceLabel={inferredIntentState.audience.label}
          />

          <CampaignIntentStep
            selectedIntent={selectedIntent}
            selectedAudience={selectedAudience}
            onIntentChange={setSelectedIntent}
            onAudienceChange={setSelectedAudience}
          />

          {savedProjectTemplates.length > 0 ? (
            <div className="rounded-[20px] border border-white/[0.026] bg-[linear-gradient(180deg,rgba(13,16,23,0.96),rgba(8,10,15,0.94))] p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full border border-primary/[0.14] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                    <ListChecks size={12} />
                    Saved variants
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-sub">
                    Reuse a project-specific setup when this workspace already has a proven campaign lane.
                  </p>
                </div>
                <span className="rounded-full border border-white/[0.026] bg-black/25 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-sub">
                  {savedProjectTemplates.length} saved
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                {savedProjectTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-[16px] border border-white/[0.026] bg-black/25 px-3.5 py-3.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-[13px] font-semibold text-text [overflow-wrap:anywhere]">{template.name}</p>
                        <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-sub">
                          {template.description || "Reusable project-specific template"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => applySavedTemplate(template.configuration)}
                          className="inline-flex items-center gap-2 rounded-[13px] border border-white/[0.04] bg-white/[0.035] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-text transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
                        >
                          Load
                          <ArrowRight size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProjectCampaignTemplate(template.id)}
                          className="rounded-[13px] border border-rose-500/24 bg-rose-500/[0.055] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-rose-300 transition hover:bg-rose-500/15"
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

          <div className="space-y-3">
            {featuredTemplate ? (
              <TemplateOptionCard
                template={featuredTemplate}
                active={featuredTemplate.id === selectedTemplateId}
                featured
                onSelect={() => chooseTemplate(featuredTemplate.id)}
              />
            ) : null}

            {secondaryTemplates.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {secondaryTemplates.map((template) => (
                  <TemplateOptionCard
                    key={template.id}
                    template={template}
                    active={template.id === selectedTemplateId}
                    onSelect={() => chooseTemplate(template.id)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    if (currentStep === "custom") {
      return (
        <div className="space-y-4">
          <BuilderStepHeader
            eyebrow={`Step ${currentStepIndex + 1}`}
            title="Shape your custom playbook"
            description="You are not using a prebuilt template here. Set the custom direction first, then continue into the workspace wiring and launch setup."
            stepIndex={currentStepIndex + 1}
            totalSteps={builderSteps.length}
          />

          <section className="relative overflow-hidden rounded-[22px] border border-white/[0.026] bg-[radial-gradient(circle_at_4%_0%,rgba(199,255,0,0.065),transparent_30%),radial-gradient(circle_at_92%_10%,rgba(88,146,255,0.045),transparent_28%),linear-gradient(180deg,rgba(13,16,23,0.98),rgba(8,10,15,0.955))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]" />
            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 max-w-3xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/[0.14] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                  <Layers3 size={12} />
                  Custom command
                </p>
                <h3 className="mt-3 text-[1.05rem] font-semibold tracking-[-0.03em] text-text md:text-[1.22rem]">
                  Build a blank campaign without losing direction
                </h3>
                <p className="mt-2 max-w-3xl text-[12px] leading-5 text-sub">
                  Give the custom route a title, public hook and internal intent before the builder starts wiring workspace context and launch controls.
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${
                  campaignTitleDraft.trim() ? "bg-primary/[0.08] text-primary" : "bg-amber-500/[0.09] text-amber-300"
                }`}
              >
                {campaignTitleDraft.trim() ? <BadgeCheck size={13} /> : <FileWarning size={13} />}
                {campaignTitleDraft.trim() ? "Ready to wire" : "Title required"}
              </span>
            </div>

            <div className="relative mt-3 grid gap-2 sm:grid-cols-3">
              <PlaybookCommandMetric label="Title" value={campaignTitleDraft.trim() ? "Ready" : "Required"} />
              <PlaybookCommandMetric label="Hook" value={customPlaybookSummary.trim() ? "Added" : "Optional"} />
              <PlaybookCommandMetric label="Direction" value={customPlaybookGoal.trim() ? "Added" : "Optional"} />
            </div>

            <div className="relative mt-3 grid gap-3 lg:items-start lg:grid-cols-2">
              <label className="block min-w-0 rounded-[16px] border border-white/[0.026] bg-black/25 p-3.5">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                  Campaign title
                </span>
                <input
                  value={campaignTitleDraft}
                  onChange={(event) => setCampaignTitleDraft(event.target.value)}
                  className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm text-text outline-none transition focus:border-primary/25"
                  placeholder="Chainwars Custom Sprint"
                />
                <p className="mt-2 text-[12px] leading-5 text-sub">
                  The public title anchors the custom setup path and final campaign route.
                </p>
              </label>

              <label className="block min-w-0 rounded-[16px] border border-white/[0.026] bg-black/25 p-3.5">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                  Short campaign hook
                </span>
                <input
                  value={customPlaybookSummary}
                  onChange={(event) => setCustomPlaybookSummary(event.target.value)}
                  className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm text-text outline-none transition focus:border-primary/25"
                  placeholder="A custom campaign for holders, community and launch traffic"
                />
                <p className="mt-2 text-[12px] leading-5 text-sub">
                  One member-facing sentence that explains why the campaign exists.
                </p>
              </label>
            </div>

            <label className="relative mt-3 block rounded-[16px] border border-white/[0.026] bg-black/25 p-3.5">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                Internal direction
              </span>
              <textarea
                value={customPlaybookGoal}
                onChange={(event) => setCustomPlaybookGoal(event.target.value)}
                rows={5}
                className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm text-text outline-none transition focus:border-primary/25"
                placeholder="Describe the flow you want to build: what should users do first, what should this campaign unlock, and what kind of reward logic should it support?"
              />
              <p className="mt-2 text-[12px] leading-5 text-sub">
                This stays internal and keeps the launch step intentional instead of blank.
              </p>
            </label>
          </section>
        </div>
      );
    }

    if (currentStep === "autofill") {
      return (
        <div className="space-y-4">
          <BuilderStepHeader
            eyebrow={`Step ${currentStepIndex + 1}`}
            title="Patch the workspace before the campaign wires itself"
            description="Use this stage to close the missing context gaps once, then move into the generated launch architecture."
            stepIndex={currentStepIndex + 1}
            totalSteps={builderSteps.length}
          />
          {renderWorkspaceContextEditor()}
        </div>
      );
    }

    if (currentStep === "flow") {
      return (
        <div className="space-y-4">
          <BuilderStepHeader
            eyebrow={`Step ${currentStepIndex + 1}`}
            title="Tune the campaign storyboard"
            description="This is the core architecture pass. Select a block in the storyboard, then refine the exact part of the campaign journey that block owns."
            stepIndex={currentStepIndex + 1}
            totalSteps={builderSteps.length}
          />

          <CampaignStoryboardCanvas
            blocks={storyboardBlocks}
            selectedBlockId={selectedStoryboardBlockId}
            onSelect={setSelectedStoryboardBlockId}
          />

          <div className="grid gap-4 xl:items-start xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>{renderFlowBlockWorkspace()}</div>
            <CampaignStoryboardInspector block={selectedStoryboardBlock}>
              {renderFlowInspectorChildren()}
            </CampaignStoryboardInspector>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <BuilderStepHeader
          eyebrow="Campaign Studio Launch"
          title="Lock the launch posture and generate the campaign"
          description="Keep the storyboard in view, focus one block at a time, and generate the campaign once the final posture feels right."
          stepIndex={currentStepIndex + 1}
          totalSteps={builderSteps.length}
        />

        <CampaignStoryboardCanvas
          blocks={storyboardBlocks}
          selectedBlockId={selectedStoryboardBlockId}
          onSelect={setSelectedStoryboardBlockId}
        />

        <div className="grid gap-4 xl:items-start xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <CampaignLaunchCommandSurface
              preview={launchPreview}
              projectName={selectedProject?.name || "No project"}
              templateLabel={selectedTemplate?.label || "No playbook"}
              questCount={includedQuestDrafts.length}
              rewardCount={includedRewardDrafts.length}
              missingContextCount={currentMissingContextFields.length}
              editedDraftCount={editedQuestCount + editedRewardCount}
              savedTemplateName={savedTemplateName}
              savedTemplateDescription={savedTemplateDescription}
              onSavedTemplateNameChange={setSavedTemplateName}
              onSavedTemplateDescriptionChange={setSavedTemplateDescription}
              onSaveVariant={saveCurrentTemplateVariant}
              savingTemplate={savingTemplate}
              canSaveVariant={Boolean(selectedProject && selectedTemplate)}
              savedTemplateMessage={savedTemplateMessage}
              generationMessage={generationMessage}
            />
            <CampaignForm
              projects={projects}
              defaultProjectId={selectedProject?.id}
              resetKey={`${selectedProject?.id || "none"}:${selectedTemplateId}`}
              studioLayout="storyboard"
              focusBlockId={selectedStoryboardBlockId}
              entrySourceLabel={entrySourceLabel}
              initialValues={
                templatePlan
                  ? {
                      ...templatePlan.campaignDraft,
                      title: campaignTitleDraft || templatePlan.campaignDraft.title,
                      shortDescription:
                        customPlaybookSummary || templatePlan.campaignDraft.shortDescription,
                      longDescription:
                        customPlaybookGoal || templatePlan.campaignDraft.longDescription,
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

                  setGenerationMessage("Campaign generated successfully. Review the next step below.");
                  setGeneratedCampaign({
                    id: campaignId,
                    title: values.title,
                  });
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

          <CampaignStoryboardInspector block={selectedStoryboardBlock}>
            <CampaignLaunchPreview preview={launchPreview} />
          </CampaignStoryboardInspector>
        </div>
      </div>
    );
  }

  const sideDockWatchItems = stepError
    ? [
        {
          label: "Current blocker",
          description: stepError,
          tone: "warning" as const,
        },
        ...storyboardWarnings,
      ]
    : storyboardWarnings;
  const continueFromSideDock = nextStep
    ? () => {
        const error = validateCurrentStep(currentStep);
        if (error) {
          setStepError(error);
          return;
        }
        attemptStepNavigation(nextStep.id);
      }
    : undefined;

  return (
    <AdminShell>
      <div className="space-y-4">
        <StudioEntryCommandDeck
          studio="Campaign Studio"
          title="Create a campaign from one guided mission lane"
          description="Project, template and source context stay visible here, while the storyboard below focuses the team on the next campaign decision."
          projectName={selectedProject?.name}
          entrySourceLabel={entrySourceLabel}
          returnHref={returnHref}
          metrics={[
            { label: "Project", value: selectedProject?.name || "Choose" },
            { label: "Template", value: selectedTemplate?.label || "Choose" },
            { label: "Source", value: entrySourceLabel || "Direct" },
          ]}
          builderAnchor="campaign-studio-builder"
        />

        <div id="campaign-studio-builder">
          <StudioShell
          eyebrow="Campaign Studio"
          title="Design the mission lane before you launch it"
          description="Move from project intent into a clean storyboard. Pick the block you want to shape, keep the member-facing preview visible, and only see the controls that matter for the current campaign decision."
          progressPercent={progressPercent}
          metrics={null}
          contextPills={null}
          steps={builderSteps.map((step) => ({
            id: step.id,
            eyebrow: "Step",
            label: step.label,
            description: step.description,
            complete: visitedSteps.includes(step.id),
          }))}
          currentStep={currentStep}
          onSelectStep={attemptStepNavigation}
          topFrame={
            <StudioTopFrame
              eyebrow="Campaign Studio"
              title="Design the mission lane before you launch it"
              description="Start from project intent, patch the workspace only where it matters, then move into a storyboard that keeps goals, quests, rewards and launch posture aligned."
              actions={
                <StudioModeToggle
                  label="Studio lens"
                  value={studioLens}
                  onChange={setStudioLens}
                  options={[
                    {
                      value: "strategy",
                      label: "Strategy",
                      eyebrow: "Intent, audience, flow",
                    },
                    {
                      value: "launch",
                      label: "Launch",
                      eyebrow: "Readiness, output, next move",
                    },
                  ]}
                />
              }
              context={
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/[0.026] bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-text">
                    {selectedProject?.name || "No workspace"}
                  </span>
                  <span className="rounded-full border border-white/[0.026] bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub">
                    {selectedTemplate?.label || "Playbook not selected"}
                  </span>
                  <span className="rounded-full border border-white/[0.026] bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub">
                    {includedQuestDrafts.length} quests
                  </span>
                  <span className="rounded-full border border-white/[0.026] bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub">
                    {includedRewardDrafts.length} rewards
                  </span>
                </div>
              }
              supporting={
                <div className="grid gap-3 md:grid-cols-3">
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
                    value={String(currentMissingContextFields.length)}
                  />
                </div>
              }
            />
          }
          leftRail={
            <StudioStepRail
              steps={storyboardStepItems}
              currentStep={currentStep}
              onSelect={attemptStepNavigation}
            />
          }
          rightRail={
            <CampaignStudioSideDock
              currentStepLabel={currentStepMeta.label}
              progressPercent={progressPercent}
              actionLabel={nextStep ? `Continue to ${nextStep.label}` : "Generate below"}
              onAction={continueFromSideDock}
              projectName={selectedProject?.name || "No project"}
              templateLabel={selectedTemplate?.label || "Choose playbook"}
              templateFit={
                selectedTemplate
                  ? `${selectedTemplate.fitLabel} (${selectedTemplate.fitScore}/100)`
                  : "Not selected"
              }
              questCount={`${includedQuestDrafts.length}/${templatePlan?.questDrafts.length ?? 0}`}
              rewardCount={`${includedRewardDrafts.length}/${templatePlan?.rewardDrafts.length ?? 0}`}
              missingContextCount={currentMissingContextFields.length}
              editedDraftCount={editedQuestCount + editedRewardCount}
              audienceLabel={selectedAudience.replace(/_/g, " ")}
              missionItems={missionMap}
              watchItems={sideDockWatchItems}
            />
          }
          canvasClassName="space-y-4"
        >
          {renderStudioCore()}
          </StudioShell>
        </div>

        {generatedCampaign ? (
          <SuccessCampaignModal
            campaign={generatedCampaign}
            onClose={() => setGeneratedCampaign(null)}
            onOpenOverview={() => {
              setGeneratedCampaign(null);
              router.push("/campaigns");
            }}
            onOpenCampaign={() => {
              setGeneratedCampaign(null);
              router.push(`/campaigns/${generatedCampaign.id}`);
            }}
          />
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
          footerLabel={`Step ${currentStepIndex + 1} - ${currentStepMeta.label}`}
        />
      </div>
    </AdminShell>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={null}>
      <NewCampaignPageContent />
    </Suspense>
  );
}

function SuccessCampaignModal({
  campaign,
  onClose,
  onOpenOverview,
  onOpenCampaign,
}: {
  campaign: {
    id: string;
    title: string;
  };
  onClose: () => void;
  onOpenOverview: () => void;
  onOpenCampaign: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[24px] border border-primary/[0.18] bg-[radial-gradient(circle_at_8%_0%,rgba(199,255,0,0.12),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(88,146,255,0.07),transparent_28%),linear-gradient(180deg,rgba(16,20,28,0.985),rgba(8,10,16,0.985))] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.46)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(199,255,0,0.34),transparent)]" />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <section className="rounded-[20px] border border-white/[0.026] bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/[0.14] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                  <CheckCircle2 size={12} />
                  Campaign generated
                </p>
                <h3 className="mt-3 break-words text-2xl font-semibold tracking-[-0.04em] text-text md:text-3xl [overflow-wrap:anywhere]">
                  {campaign.title}
                </h3>
                <p className="mt-3 max-w-2xl text-[13px] leading-6 text-sub">
                  The campaign shell is created. Next, inspect the generated campaign workspace, confirm linked quests and rewards, then publish when the route is ready.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/[0.04] bg-white/[0.025] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-sub transition hover:bg-white/[0.08] hover:text-text"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <PreviewStat label="Status" value="Generated" />
              <PreviewStat label="Review" value="Campaign workspace" />
              <PreviewStat label="Next" value="Publish check" />
            </div>
          </section>

          <aside className="rounded-[20px] border border-white/[0.026] bg-black/25 p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
              Launch handoff
            </p>
            <div className="mt-3 space-y-2">
              {[
                "Inspect campaign details",
                "Check linked quests",
                "Confirm reward posture",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.026] bg-white/[0.018] px-3 py-2.5"
                >
                  <CheckCircle2 size={13} className="shrink-0 text-primary" />
                  <p className="text-[12px] font-semibold text-text">{item}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="mt-3 rounded-[18px] border border-white/[0.026] bg-white/[0.018] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-[12px] leading-5 text-sub">
              Use overview for pipeline status, or open the generated workspace directly when you want to inspect the campaign, quests and rewards in context.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenCampaign}
                className="inline-flex items-center gap-2 rounded-[14px] border border-white/[0.04] bg-white/[0.035] px-4 py-3 text-[11px] font-black uppercase tracking-[0.13em] text-text transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
              >
                Open campaign
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={onOpenOverview}
                className="inline-flex items-center gap-2 rounded-[14px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.13em] text-black transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Check overview
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateOptionCard({
  template,
  active,
  featured = false,
  onSelect,
}: {
  template: CampaignTemplateOption;
  active: boolean;
  featured?: boolean;
  onSelect: () => void;
}) {
  const fitTone =
    template.fitLabel === "Best fit"
      ? "bg-primary/[0.11] text-primary"
      : template.fitLabel === "Strong fit"
        ? "bg-emerald-500/15 text-emerald-300"
        : template.fitLabel === "Good fit"
          ? "bg-white/[0.055] text-text"
          : "bg-amber-500/[0.08] text-amber-300";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group overflow-hidden rounded-[20px] border text-left transition duration-200 hover:-translate-y-0.5 ${
        featured ? "p-4 md:p-5" : "p-3.5"
      } ${
        active
          ? "border-primary/35 bg-[linear-gradient(135deg,rgba(199,255,0,0.105),rgba(255,255,255,0.035))] shadow-[0_18px_36px_rgba(0,0,0,0.22)]"
          : "border-white/[0.026] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.014))] hover:border-white/[0.05] hover:bg-white/[0.045]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            {featured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.075] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-primary">
                <Sparkles size={11} />
                Featured fit
              </span>
            ) : null}
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${fitTone}`}>
              {template.fitLabel}
            </span>
          </div>
          <p className={`mt-3 break-words font-semibold tracking-[-0.02em] text-text [overflow-wrap:anywhere] ${featured ? "text-[1.06rem]" : "text-[0.95rem]"}`}>
            {template.label}
          </p>
          <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-sub">{template.summary}</p>
          {template.fitReasons[0] ? (
            <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-sub">
              <span className="font-semibold text-text">Why it fits:</span>{" "}
              {template.fitReasons[0]}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] ${
              active ? "bg-primary/[0.08] text-primary" : "bg-black/25 text-sub"
            }`}
          >
            {active ? <BadgeCheck size={12} /> : <ArrowRight size={12} />}
            {active ? "Selected" : "Choose"}
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <TemplateOptionMetric label="Fit" value={`${template.fitScore}/100`} />
        <TemplateOptionMetric label="Quests" value={template.quests.length} />
        <TemplateOptionMetric label="Rewards" value={template.rewards.length} />
      </div>
    </button>
  );
}

function TemplateOptionMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  const hasXpBadge = isXpDisplay(label, value);

  return (
    <div className="min-w-0 rounded-[14px] border border-white/[0.022] bg-black/20 px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <div className="mt-1">
        {hasXpBadge ? <XpValue size="sm">{value}</XpValue> : <p className="truncate text-[12px] font-semibold text-text">{value}</p>}
      </div>
    </div>
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
    <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.018] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05]">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
        {label}
      </p>
      <p className="mt-2 text-lg font-extrabold text-text">{value}</p>
    </div>
  );
}

function TemplateDraftLaneHeader({
  eyebrow,
  title,
  description,
  metrics,
}: {
  eyebrow: string;
  title: string;
  description: string;
  metrics: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-white/[0.026] bg-[radial-gradient(circle_at_4%_0%,rgba(199,255,0,0.07),transparent_30%),linear-gradient(180deg,rgba(13,16,23,0.98),rgba(8,10,15,0.96))] p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/[0.14] bg-primary/[0.055] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
            <Route size={12} />
            {eyebrow}
          </p>
          <h3 className="mt-3 text-[1.05rem] font-semibold tracking-[-0.03em] text-text md:text-[1.18rem]">
            {title}
          </h3>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-sub">{description}</p>
        </div>

        <div className="grid w-full gap-2 sm:w-auto sm:min-w-[280px] sm:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[14px] border border-white/[0.026] bg-black/25 px-3 py-2.5"
            >
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">
                {metric.label}
              </p>
              <p className="mt-1 text-[0.95rem] font-semibold tracking-[-0.02em] text-text">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateQuestCard({
  item,
  index,
  included,
  expanded,
  onToggle,
  onToggleExpand,
  onEdit,
}: {
  item: ResolvedQuestDraft;
  index: number;
  included: boolean;
  expanded: boolean;
  onToggle: () => void;
  onToggleExpand: () => void;
  onEdit: (
    key: string,
    field: keyof EditableQuestDraft,
    value: string | number
  ) => void;
}) {
  const hasMissingContext = item.missingProjectFields.length > 0;
  const readinessLabel = !included
    ? "Skipped"
    : hasMissingContext
      ? "Needs context"
      : "Ready";
  const readinessClass = !included
    ? "bg-white/[0.055] text-sub"
    : hasMissingContext
      ? "bg-amber-500/[0.09] text-amber-300"
      : "bg-primary/[0.08] text-primary";
  const quickRead = hasMissingContext
    ? `Needs ${item.missingProjectFields
        .map((field) => formatProjectFieldLabel(field))
        .join(", ")} before launch.`
    : "Ready to generate with the current campaign setup.";

  return (
    <div
      className={`overflow-hidden rounded-[18px] border px-3.5 py-3.5 shadow-[0_14px_32px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-0.5 ${
        included
          ? "border-white/[0.035] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))]"
          : "border-white/[0.02] bg-black/20 opacity-75"
      }`}
    >
      <div className="grid gap-3 lg:grid-cols-[42px_minmax(0,1fr)_auto] lg:items-start">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-[11px] font-black ${
            included
              ? "border-primary/24 bg-primary/[0.07] text-primary shadow-[0_0_18px_rgba(199,255,0,0.18)]"
              : "border-white/[0.04] bg-white/[0.025] text-sub"
          }`}
        >
          {index + 1}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/[0.075] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] text-primary">
              {item.draft.questType}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] ${readinessClass}`}>
              {readinessLabel}
            </span>
          </div>
          <p className="mt-2 break-words text-[0.96rem] font-semibold leading-5 text-text [overflow-wrap:anywhere]">
            {item.draft.title}
          </p>
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-sub">
            {item.draft.description}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.032] bg-white/[0.035] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-text transition hover:bg-white/[0.07]"
          >
            <ListChecks size={12} />
            {expanded ? "Collapse" : "Edit"}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition ${
              included
                ? "bg-primary/[0.08] text-primary hover:bg-primary/[0.13]"
                : "bg-white/[0.055] text-sub hover:bg-white/[0.09] hover:text-text"
            }`}
          >
            {included ? <BadgeCheck size={12} /> : <ArrowRight size={12} />}
            {included ? "Included" : "Skipped"}
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <DraftLaneStat label="Reward" value={`${item.draft.xp} XP`} />
        <DraftLaneStat label="Action" value={item.draft.actionLabel || "Open route"} />
        <DraftLaneStat
          label="Context"
          value={hasMissingContext ? `${item.missingProjectFields.length} missing` : "Clear"}
        />
      </div>

      {expanded ? (
        <div className="mt-3 rounded-[16px] border border-white/[0.026] bg-black/25 p-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                Quest title
              </span>
              <input
                value={item.draft.title}
                onChange={(event) => onEdit(item.key, "title", event.target.value)}
                className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm outline-none transition focus:border-primary/25"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                XP
              </span>
              <input
                type="number"
                min={0}
                value={item.draft.xp}
                onChange={(event) =>
                  onEdit(item.key, "xp", Number(event.target.value || 0))
                }
                className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm outline-none transition focus:border-primary/25"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                Description
              </span>
              <textarea
                value={item.draft.description}
                onChange={(event) =>
                  onEdit(item.key, "description", event.target.value)
                }
                rows={3}
                className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm outline-none transition focus:border-primary/25"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                Action label
              </span>
              <input
                value={item.draft.actionLabel}
                onChange={(event) =>
                  onEdit(item.key, "actionLabel", event.target.value)
                }
                className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm outline-none transition focus:border-primary/25"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                Action URL
              </span>
              <input
                value={item.draft.actionUrl ?? ""}
                onChange={(event) =>
                  onEdit(item.key, "actionUrl", event.target.value)
                }
                className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm outline-none transition focus:border-primary/25"
                placeholder="https://..."
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[16px] border border-white/[0.022] bg-black/20 px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {hasMissingContext ? (
              <FileWarning size={14} className="shrink-0 text-amber-300" />
            ) : (
              <CheckCircle2 size={14} className="shrink-0 text-primary" />
            )}
            <p className="truncate text-[12px] font-semibold text-text">{quickRead}</p>
          </div>
          <ArrowRight size={13} className="shrink-0 text-sub" />
        </div>
      )}
    </div>
  );
}

function TemplateRewardCard({
  item,
  index,
  included,
  expanded,
  onToggle,
  onToggleExpand,
  onEdit,
}: {
  item: ResolvedRewardDraft;
  index: number;
  included: boolean;
  expanded: boolean;
  onToggle: () => void;
  onToggleExpand: () => void;
  onEdit: (
    key: string,
    field: keyof EditableRewardDraft,
    value: string | number
  ) => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[18px] border px-3.5 py-3.5 shadow-[0_14px_32px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-0.5 ${
        included
          ? "border-white/[0.035] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))]"
          : "border-white/[0.02] bg-black/20 opacity-75"
      }`}
    >
      <div className="grid gap-3 lg:grid-cols-[42px_minmax(0,1fr)_auto] lg:items-start">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-[11px] font-black ${
            included
              ? "border-primary/24 bg-primary/[0.07] text-primary shadow-[0_0_18px_rgba(199,255,0,0.18)]"
              : "border-white/[0.04] bg-white/[0.025] text-sub"
          }`}
        >
          {index + 1}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/[0.055] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] text-text">
              {item.draft.rewardType}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] ${
                included ? "bg-primary/[0.08] text-primary" : "bg-white/[0.055] text-sub"
              }`}
            >
              {included ? "Included" : "Skipped"}
            </span>
          </div>
          <p className="mt-2 break-words text-[0.96rem] font-semibold leading-5 text-text [overflow-wrap:anywhere]">
            {item.draft.title}
          </p>
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-sub">
            {item.draft.description}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.032] bg-white/[0.035] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-text transition hover:bg-white/[0.07]"
          >
            <ListChecks size={12} />
            {expanded ? "Collapse" : "Edit"}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] transition ${
              included
                ? "bg-primary/[0.08] text-primary hover:bg-primary/[0.13]"
                : "bg-white/[0.055] text-sub hover:bg-white/[0.09] hover:text-text"
            }`}
          >
            {included ? <BadgeCheck size={12} /> : <ArrowRight size={12} />}
            {included ? "Included" : "Skipped"}
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <DraftLaneStat label="Cost" value={`${item.draft.cost} XP`} />
        <DraftLaneStat label="Rarity" value={item.draft.rarity} />
        <DraftLaneStat label="State" value={included ? "Ready" : "Skipped"} />
      </div>

      {expanded ? (
        <div className="mt-3 rounded-[16px] border border-white/[0.026] bg-black/25 p-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                Reward title
              </span>
              <input
                value={item.draft.title}
                onChange={(event) => onEdit(item.key, "title", event.target.value)}
                className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm outline-none transition focus:border-primary/25"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                Cost
              </span>
              <input
                type="number"
                min={0}
                value={item.draft.cost}
                onChange={(event) =>
                  onEdit(item.key, "cost", Number(event.target.value || 0))
                }
                className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm outline-none transition focus:border-primary/25"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-sub">
                Description
              </span>
              <textarea
                value={item.draft.description}
                onChange={(event) =>
                  onEdit(item.key, "description", event.target.value)
                }
                rows={3}
                className="w-full rounded-[14px] border border-white/[0.026] bg-black/25 px-3.5 py-3 text-sm outline-none transition focus:border-primary/25"
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[16px] border border-white/[0.022] bg-black/20 px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <CheckCircle2 size={14} className="shrink-0 text-primary" />
            <p className="truncate text-[12px] font-semibold text-text">
            This reward will ship as a {item.draft.rarity} {item.draft.rewardType} reward
            worth {item.draft.cost} XP.
            </p>
          </div>
          <ArrowRight size={13} className="shrink-0 text-sub" />
        </div>
      )}
    </div>
  );
}

function DraftLaneStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-white/[0.022] bg-black/20 px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1 truncate text-[12px] font-semibold text-text">{value}</p>
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
    <div className="rounded-[20px] border border-white/[0.026] bg-black/20 px-4 py-4">
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
    <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.018] px-4 py-4">
      <p className="text-sm font-bold text-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{description}</p>
      <p className="mt-3 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
