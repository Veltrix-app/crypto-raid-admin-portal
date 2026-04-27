"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type {
  GeneratedTweetRaidRow,
  TweetToRaidAutopilotState,
  TweetToRaidCandidateRow,
  TweetToRaidEventRow,
  TweetToRaidSourceMode,
  TweetToRaidSourceRow,
  TweetToRaidSourceStatus,
} from "@/lib/community/tweet-to-raid-autopilot";

type CampaignOption = {
  id: string;
  title: string;
};

type Props = {
  projectId: string;
  projectName: string;
  campaigns: CampaignOption[];
};

type SourceForm = {
  sourceId: string;
  xUsername: string;
  mode: TweetToRaidSourceMode;
  status: TweetToRaidSourceStatus;
  requiredHashtags: string;
  excludeReplies: boolean;
  excludeReposts: boolean;
  cooldownMinutes: string;
  maxRaidsPerDay: string;
  defaultRewardXp: string;
  defaultDurationMinutes: string;
  defaultCampaignId: string;
  defaultButtonLabel: string;
  defaultArtworkUrl: string;
};

type ManualForm = {
  tweetUrl: string;
  text: string;
  mediaUrlsText: string;
  forceMode: TweetToRaidSourceMode;
};

const emptyState: TweetToRaidAutopilotState = {
  botConfigured: false,
  jobSecretConfigured: false,
  sources: [],
  candidates: [],
  events: [],
  raids: [],
};

const emptySourceForm: SourceForm = {
  sourceId: "",
  xUsername: "",
  mode: "review",
  status: "paused",
  requiredHashtags: "",
  excludeReplies: true,
  excludeReposts: true,
  cooldownMinutes: "30",
  maxRaidsPerDay: "6",
  defaultRewardXp: "50",
  defaultDurationMinutes: "1440",
  defaultCampaignId: "",
  defaultButtonLabel: "Open raid",
  defaultArtworkUrl: "",
};

const emptyManualForm: ManualForm = {
  tweetUrl: "",
  text: "",
  mediaUrlsText: "",
  forceMode: "review",
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

function formatHashtags(values: string[] | null) {
  return values?.length ? values.map((tag) => `#${tag}`).join(", ") : "No hashtag gate";
}

function sourceToForm(source: TweetToRaidSourceRow): SourceForm {
  return {
    sourceId: source.id,
    xUsername: source.x_username,
    mode: source.mode,
    status: source.status,
    requiredHashtags: (source.required_hashtags ?? []).map((tag) => `#${tag}`).join(", "),
    excludeReplies: source.exclude_replies !== false,
    excludeReposts: source.exclude_reposts !== false,
    cooldownMinutes: String(source.cooldown_minutes ?? 30),
    maxRaidsPerDay: String(source.max_raids_per_day ?? 6),
    defaultRewardXp: String(source.default_reward_xp ?? 50),
    defaultDurationMinutes: String(source.default_duration_minutes ?? 1440),
    defaultCampaignId: source.default_campaign_id ?? "",
    defaultButtonLabel: source.default_button_label ?? "Open raid",
    defaultArtworkUrl: source.default_artwork_url ?? "",
  };
}

function readStatePayload(value: unknown): TweetToRaidAutopilotState {
  const payload = value && typeof value === "object" ? (value as Partial<TweetToRaidAutopilotState>) : {};

  return {
    botConfigured: payload.botConfigured === true,
    jobSecretConfigured: payload.jobSecretConfigured === true,
    sources: Array.isArray(payload.sources) ? payload.sources : [],
    candidates: Array.isArray(payload.candidates) ? payload.candidates : [],
    events: Array.isArray(payload.events) ? payload.events : [],
    raids: Array.isArray(payload.raids) ? payload.raids : [],
  };
}

function getCandidateTone(candidate: TweetToRaidCandidateRow) {
  if (candidate.status === "approved") return "success";
  if (candidate.status === "rejected" || candidate.status === "expired") return "warning";
  return "default";
}

function getEventTone(event: TweetToRaidEventRow) {
  if (event.decision === "created_raid") return "success";
  if (event.decision === "failed") return "danger";
  if (event.decision === "skipped") return "warning";
  return "default";
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-[10px] font-bold uppercase tracking-[0.14em] text-sub">
      {label}
      {children}
    </label>
  );
}

function inputClassName(extra = "") {
  return `w-full rounded-[14px] border border-line bg-card px-3 py-2.5 text-[12px] normal-case tracking-normal text-text outline-none transition focus:border-primary/35 ${extra}`;
}

export function TweetToRaidAutopilotPanel({ projectId, projectName, campaigns }: Props) {
  const [state, setState] = useState<TweetToRaidAutopilotState>(emptyState);
  const [sourceForm, setSourceForm] = useState<SourceForm>(emptySourceForm);
  const [manualForm, setManualForm] = useState<ManualForm>(emptyManualForm);
  const [loading, setLoading] = useState(true);
  const [workingAction, setWorkingAction] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");

  const activeSource = state.sources.find((source) => source.id === sourceForm.sourceId) ?? state.sources[0] ?? null;
  const pendingCandidates = state.candidates.filter((candidate) => candidate.status === "pending");

  useEffect(() => {
    let cancelled = false;

    async function loadAutopilot() {
      setLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/tweet-to-raid-autopilot`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);

        if (cancelled) return;

        if (!response.ok || !payload?.ok) {
          throw new Error(
            payload && typeof payload.error === "string"
              ? payload.error
              : "Tweet-to-Raid Autopilot could not load."
          );
        }

        const nextState = readStatePayload(payload);
        setState(nextState);
        setSourceForm(nextState.sources[0] ? sourceToForm(nextState.sources[0]) : emptySourceForm);
      } catch (error) {
        if (!cancelled) {
          setNotice(error instanceof Error ? error.message : "Tweet-to-Raid Autopilot could not load.");
          setNoticeTone("error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAutopilot();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function runAction(action: string, body: Record<string, unknown>, successMessage: string) {
    setWorkingAction(action);
    setNotice("");

    try {
      const response = await fetch(`/api/projects/${projectId}/tweet-to-raid-autopilot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, ...body }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload && typeof payload.error === "string"
            ? payload.error
            : "Tweet-to-Raid Autopilot action failed."
        );
      }

      const nextState = readStatePayload(payload);
      setState(nextState);
      if (nextState.sources.length > 0 && action === "save_source") {
        const nextSource =
          nextState.sources.find((source) => source.x_username === sourceForm.xUsername.replace(/^@+/, "").toLowerCase()) ??
          nextState.sources[0];
        setSourceForm(sourceToForm(nextSource));
      }
      setNotice(typeof payload.message === "string" ? payload.message : successMessage);
      setNoticeTone("success");
      if (action === "manual_ingest") {
        setManualForm((current) => ({ ...current, tweetUrl: "", text: "", mediaUrlsText: "" }));
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Tweet-to-Raid Autopilot action failed.");
      setNoticeTone("error");
    } finally {
      setWorkingAction(null);
    }
  }

  const sourceStatus = activeSource?.status ?? sourceForm.status;
  const sourceMode = activeSource?.mode ?? sourceForm.mode;
  const pendingCount = pendingCandidates.length;
  const lastEvent = state.events[0] ?? null;
  const lastRaid = state.raids[0] ?? null;

  return (
    <OpsPanel
      eyebrow="Tweet-to-Raid Autopilot"
      title="Turn every project tweet into a controlled raid"
      description="Connect an X source, choose review or auto-live, then let the bot generate raids for the webapp and push them to Discord or Telegram when approved."
      tone="accent"
      action={
        <div className="flex flex-wrap gap-2">
          <OpsStatusPill tone={sourceStatus === "active" ? "success" : "warning"}>
            {sourceStatus}
          </OpsStatusPill>
          <OpsStatusPill tone={sourceMode === "auto_live" ? "success" : "default"}>
            {sourceMode === "auto_live" ? "Auto live" : "Review first"}
          </OpsStatusPill>
        </div>
      }
    >
      <div id="tweet-to-raid" className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard
            label="Sources"
            value={state.sources.length}
            sub={state.sources.length ? "Configured X sources." : "Add the first X source."}
            emphasis={state.sources.length > 0 ? "primary" : "warning"}
          />
          <OpsMetricCard
            label="Review queue"
            value={pendingCount}
            sub="Generated raids waiting for approval."
            emphasis={pendingCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Generated raids"
            value={state.raids.length}
            sub={lastRaid ? `Latest: ${lastRaid.title}` : "No generated raids yet."}
            emphasis={state.raids.length > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Bot endpoint"
            value={state.botConfigured ? "Ready" : "Missing"}
            sub={state.jobSecretConfigured ? "Job secret configured." : "Secret optional or missing."}
            emphasis={state.botConfigured ? "primary" : "warning"}
          />
        </div>

        {loading ? (
          <div className="rounded-[18px] border border-line bg-card px-4 py-4 text-sm text-sub">
            Loading Tweet-to-Raid Autopilot...
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
          <div className="space-y-4">
            <div className="rounded-[22px] border border-line bg-card2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold text-text">Source control</p>
                  <p className="mt-1.5 text-[12px] leading-5 text-sub">
                    Start safe in review mode. Switch to auto-live only when the source, hashtag gate and delivery rail are proven.
                  </p>
                </div>
                {state.sources.length > 1 ? (
                  <select
                    value={sourceForm.sourceId}
                    onChange={(event) => {
                      const nextSource = state.sources.find((source) => source.id === event.target.value);
                      if (nextSource) setSourceForm(sourceToForm(nextSource));
                    }}
                    className={inputClassName("max-w-[220px]")}
                  >
                    {state.sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        @{source.x_username}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="X username">
                  <input
                    value={sourceForm.xUsername}
                    onChange={(event) =>
                      setSourceForm((current) => ({ ...current, xUsername: event.target.value }))
                    }
                    placeholder="@project"
                    className={inputClassName()}
                  />
                </Field>
                <Field label="Required hashtags">
                  <input
                    value={sourceForm.requiredHashtags}
                    onChange={(event) =>
                      setSourceForm((current) => ({
                        ...current,
                        requiredHashtags: event.target.value,
                      }))
                    }
                    placeholder="#vyntro, #raid"
                    className={inputClassName()}
                  />
                </Field>
                <Field label="Mode">
                  <select
                    value={sourceForm.mode}
                    onChange={(event) =>
                      setSourceForm((current) => ({
                        ...current,
                        mode: event.target.value as TweetToRaidSourceMode,
                      }))
                    }
                    className={inputClassName()}
                  >
                    <option value="review">Review first</option>
                    <option value="auto_live">Auto-live</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={sourceForm.status}
                    onChange={(event) =>
                      setSourceForm((current) => ({
                        ...current,
                        status: event.target.value as TweetToRaidSourceStatus,
                      }))
                    }
                    className={inputClassName()}
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </Field>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <Field label="XP">
                  <input
                    value={sourceForm.defaultRewardXp}
                    onChange={(event) =>
                      setSourceForm((current) => ({
                        ...current,
                        defaultRewardXp: event.target.value,
                      }))
                    }
                    inputMode="numeric"
                    className={inputClassName()}
                  />
                </Field>
                <Field label="Duration min">
                  <input
                    value={sourceForm.defaultDurationMinutes}
                    onChange={(event) =>
                      setSourceForm((current) => ({
                        ...current,
                        defaultDurationMinutes: event.target.value,
                      }))
                    }
                    inputMode="numeric"
                    className={inputClassName()}
                  />
                </Field>
                <Field label="Cooldown min">
                  <input
                    value={sourceForm.cooldownMinutes}
                    onChange={(event) =>
                      setSourceForm((current) => ({
                        ...current,
                        cooldownMinutes: event.target.value,
                      }))
                    }
                    inputMode="numeric"
                    className={inputClassName()}
                  />
                </Field>
                <Field label="Max/day">
                  <input
                    value={sourceForm.maxRaidsPerDay}
                    onChange={(event) =>
                      setSourceForm((current) => ({
                        ...current,
                        maxRaidsPerDay: event.target.value,
                      }))
                    }
                    inputMode="numeric"
                    className={inputClassName()}
                  />
                </Field>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="Default campaign">
                  <select
                    value={sourceForm.defaultCampaignId}
                    onChange={(event) =>
                      setSourceForm((current) => ({
                        ...current,
                        defaultCampaignId: event.target.value,
                      }))
                    }
                    className={inputClassName()}
                  >
                    <option value="">No campaign link</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Artwork URL">
                  <input
                    value={sourceForm.defaultArtworkUrl}
                    onChange={(event) =>
                      setSourceForm((current) => ({
                        ...current,
                        defaultArtworkUrl: event.target.value,
                      }))
                    }
                    placeholder="Optional fallback image URL"
                    className={inputClassName()}
                  />
                </Field>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="flex items-center justify-between gap-3 rounded-[16px] border border-line bg-card px-3 py-2.5 text-[12px] font-semibold text-text">
                  Exclude replies
                  <input
                    type="checkbox"
                    checked={sourceForm.excludeReplies}
                    onChange={(event) =>
                      setSourceForm((current) => ({
                        ...current,
                        excludeReplies: event.target.checked,
                      }))
                    }
                  />
                </label>
                <label className="flex items-center justify-between gap-3 rounded-[16px] border border-line bg-card px-3 py-2.5 text-[12px] font-semibold text-text">
                  Exclude reposts
                  <input
                    type="checkbox"
                    checked={sourceForm.excludeReposts}
                    onChange={(event) =>
                      setSourceForm((current) => ({
                        ...current,
                        excludeReposts: event.target.checked,
                      }))
                    }
                  />
                </label>
                <button
                  type="button"
                  disabled={workingAction === "save_source"}
                  onClick={() =>
                    void runAction("save_source", sourceForm, "Tweet-to-Raid source saved.")
                  }
                  className="rounded-[16px] bg-primary px-4 py-2.5 text-[12px] font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {workingAction === "save_source" ? "Saving..." : "Save autopilot"}
                </button>
              </div>
            </div>

            <div className="rounded-[22px] border border-line bg-card2 p-4">
              <p className="text-[13px] font-bold text-text">Manual ingest test</p>
              <p className="mt-1.5 text-[12px] leading-5 text-sub">
                Use this to prove the full route before real automation: X post in, review candidate or live raid out.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_170px]">
                <Field label="Tweet URL">
                  <input
                    value={manualForm.tweetUrl}
                    onChange={(event) =>
                      setManualForm((current) => ({ ...current, tweetUrl: event.target.value }))
                    }
                    placeholder="https://x.com/project/status/..."
                    className={inputClassName()}
                  />
                </Field>
                <Field label="Run mode">
                  <select
                    value={manualForm.forceMode}
                    onChange={(event) =>
                      setManualForm((current) => ({
                        ...current,
                        forceMode: event.target.value as TweetToRaidSourceMode,
                      }))
                    }
                    className={inputClassName()}
                  >
                    <option value="review">Create candidate</option>
                    <option value="auto_live">Create live raid</option>
                  </select>
                </Field>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
                <Field label="Tweet text">
                  <textarea
                    value={manualForm.text}
                    onChange={(event) =>
                      setManualForm((current) => ({ ...current, text: event.target.value }))
                    }
                    placeholder={`Paste the ${projectName} tweet text here.`}
                    rows={4}
                    className={inputClassName("resize-none")}
                  />
                </Field>
                <Field label="Media URLs">
                  <textarea
                    value={manualForm.mediaUrlsText}
                    onChange={(event) =>
                      setManualForm((current) => ({
                        ...current,
                        mediaUrlsText: event.target.value,
                      }))
                    }
                    placeholder="Optional image URLs, one per line"
                    rows={4}
                    className={inputClassName("resize-none")}
                  />
                </Field>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] leading-5 text-sub">
                  Current gate: {activeSource ? formatHashtags(activeSource.required_hashtags) : "Save a source first."}
                </p>
                <button
                  type="button"
                  disabled={workingAction === "manual_ingest" || !activeSource || !state.botConfigured}
                  onClick={() =>
                    void runAction(
                      "manual_ingest",
                      {
                        ...manualForm,
                        sourceId: activeSource?.id ?? "",
                        fallbackUsername: sourceForm.xUsername,
                      },
                      "Tweet-to-Raid ingest completed."
                    )
                  }
                  className="rounded-[16px] border border-line bg-card px-4 py-2.5 text-[12px] font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {workingAction === "manual_ingest" ? "Running..." : "Generate from tweet"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] border border-line bg-card2 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold text-text">Review queue</p>
                  <p className="mt-1.5 text-[12px] leading-5 text-sub">
                    Approve turns a candidate into a live webapp raid and posts the rail to connected community channels.
                  </p>
                </div>
                <OpsStatusPill tone={pendingCount > 0 ? "warning" : "success"}>
                  {pendingCount} pending
                </OpsStatusPill>
              </div>

              <div className="mt-4 space-y-3">
                {state.candidates.length > 0 ? (
                  state.candidates.map((candidate) => (
                    <div key={candidate.id} className="rounded-[18px] border border-line bg-card px-3 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-[13px] font-bold text-text">
                            {candidate.title}
                          </p>
                          <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-sub">
                            {candidate.short_description || "No description generated."}
                          </p>
                        </div>
                        <OpsStatusPill tone={getCandidateTone(candidate)}>{candidate.status}</OpsStatusPill>
                      </div>
                      <div className="mt-3 grid gap-2 text-[11px] text-sub sm:grid-cols-2">
                        <span>XP: +{candidate.reward_xp}</span>
                        <span>Ends: {formatDate(candidate.ends_at)}</span>
                      </div>
                      {candidate.tweet_url ? (
                        <a
                          href={candidate.tweet_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex text-[12px] font-bold text-primary"
                        >
                          Open source post
                        </a>
                      ) : null}
                      {candidate.status === "pending" ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            disabled={workingAction === "approve_candidate"}
                            onClick={() =>
                              void runAction(
                                "approve_candidate",
                                { candidateId: candidate.id },
                                "Tweet-to-Raid candidate approved."
                              )
                            }
                            className="rounded-[14px] bg-primary px-3 py-2 text-[12px] font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Approve live raid
                          </button>
                          <button
                            type="button"
                            disabled={workingAction === "reject_candidate"}
                            onClick={() =>
                              void runAction(
                                "reject_candidate",
                                { candidateId: candidate.id },
                                "Tweet-to-Raid candidate rejected."
                              )
                            }
                            className="rounded-[14px] border border-line bg-card px-3 py-2 text-[12px] font-bold text-text hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-line bg-card px-4 py-5 text-[12px] leading-5 text-sub">
                    No generated candidates yet. Save a source and run a manual ingest test to prove the flow.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[22px] border border-line bg-card2 p-4">
              <p className="text-[13px] font-bold text-text">Autopilot history</p>
              <p className="mt-1.5 text-[12px] leading-5 text-sub">
                Latest source event: {lastEvent ? `${lastEvent.decision_reason} (${formatDate(lastEvent.received_at)})` : "No events yet."}
              </p>

              <div className="mt-4 grid gap-3">
                {state.raids.slice(0, 3).map((raid: GeneratedTweetRaidRow) => (
                  <div key={raid.id} className="rounded-[16px] border border-line bg-card px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-[12px] font-bold text-text">{raid.title}</p>
                        <p className="mt-1 text-[11px] text-sub">
                          +{raid.reward_xp ?? 0} XP · {raid.status} · ends {formatDate(raid.ends_at)}
                        </p>
                      </div>
                      <a
                        href={`/raids/${raid.id}`}
                        className="shrink-0 text-[11px] font-bold text-primary"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                ))}

                {state.events.slice(0, 4).map((event) => (
                  <div key={event.id} className="rounded-[16px] border border-line bg-card px-3 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-[12px] font-bold text-text">
                          @{event.x_username} · {event.x_post_id}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-sub">
                          {event.text || event.decision_reason}
                        </p>
                      </div>
                      <OpsStatusPill tone={getEventTone(event)}>{event.decision}</OpsStatusPill>
                    </div>
                  </div>
                ))}

                {state.raids.length === 0 && state.events.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-line bg-card px-4 py-5 text-[12px] text-sub">
                    No live raid or ingest history yet.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {notice ? (
          <div
            className={`rounded-[18px] border px-4 py-3 text-[12px] leading-5 ${
              noticeTone === "error"
                ? "border-rose-400/25 bg-rose-500/10 text-rose-200"
                : "border-primary/20 bg-primary/10 text-primary"
            }`}
          >
            {notice}
          </div>
        ) : null}
      </div>
    </OpsPanel>
  );
}
