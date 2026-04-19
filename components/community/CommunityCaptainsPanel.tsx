"use client";

import type { Dispatch, SetStateAction } from "react";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type { DiscordCommunityBotSettings } from "@/components/community/community-config";

type CaptainRole = "community_captain" | "raid_lead" | "growth_lead";

type CaptainAssignment = {
  authUserId: string;
  role: CaptainRole;
  label: string;
};

type CaptainCard = CaptainAssignment & {
  username: string;
  xp: number;
  trust: number;
  linkedProviders: string[];
  walletVerified: boolean;
  openFlagCount: number;
  readinessSummary: string;
};

type CaptainCandidate = {
  authUserId: string;
  username: string;
  source: "team" | "contributors";
  roleHint: string;
  xp: number;
  trust: number;
  linkedProviders: string[];
  walletVerified: boolean;
  openFlagCount: number;
};

type Props = {
  settings: DiscordCommunityBotSettings;
  setSettings: Dispatch<SetStateAction<DiscordCommunityBotSettings>>;
  assignments: CaptainAssignment[];
  setAssignments: Dispatch<SetStateAction<CaptainAssignment[]>>;
  roster: CaptainCard[];
  candidates: CaptainCandidate[];
  savingSettings: boolean;
  savingCaptains: boolean;
  captainNotice: string;
  captainNoticeTone: "success" | "error";
  onSaveSettings: () => void;
  onSaveCaptains: () => void;
};

function roleLabel(role: CaptainRole) {
  if (role === "raid_lead") return "Raid lead";
  if (role === "growth_lead") return "Growth lead";
  return "Community captain";
}

function createEmptyAssignment(): CaptainAssignment {
  return {
    authUserId: "",
    role: "community_captain",
    label: "",
  };
}

export function CommunityCaptainsPanel({
  settings,
  setSettings,
  assignments,
  setAssignments,
  roster,
  candidates,
  savingSettings,
  savingCaptains,
  captainNotice,
  captainNoticeTone,
  onSaveSettings,
  onSaveCaptains,
}: Props) {
  const flaggedCaptains = roster.filter((captain) => captain.openFlagCount > 0).length;

  return (
    <OpsPanel
      eyebrow="Captains"
      title="Captain rail and community leadership"
      description="Assign project-private community captains who can own raids, growth waves and community pressure without leaking into other projects."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard
            label="Captain roster"
            value={roster.length}
            sub="Live captain seats currently assigned to this project."
            emphasis={roster.length > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Candidate pool"
            value={candidates.length}
            sub="Team members and high-signal contributors ready for captain review."
          />
          <OpsMetricCard
            label="Wallet ready"
            value={roster.filter((captain) => captain.walletVerified).length}
            sub="Assigned captains with a verified wallet identity."
          />
          <OpsMetricCard
            label="Needs review"
            value={flaggedCaptains}
            sub="Captain seats currently carrying open quality flags."
            emphasis={flaggedCaptains > 0 ? "warning" : "default"}
          />
        </div>

        <div className="rounded-[24px] border border-line bg-card2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">Captain controls</p>
              <p className="mt-2 text-sm text-sub">
                Keep this rail opt-in and only assign captains who are ready to operate in this
                project's community stack.
              </p>
            </div>
            <OpsStatusPill tone={settings.captainsEnabled ? "success" : "default"}>
              {settings.captainsEnabled ? "Captain rail enabled" : "Captain rail parked"}
            </OpsStatusPill>
          </div>

          <label className="mt-4 flex items-center gap-3 rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-text">
            <input
              type="checkbox"
              checked={settings.captainsEnabled}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  captainsEnabled: event.target.checked,
                }))
              }
            />
            Enable captain rail for this project
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSaveSettings}
              disabled={savingSettings}
              className="rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingSettings ? "Saving settings..." : "Save captain settings"}
            </button>
            <button
              type="button"
              onClick={onSaveCaptains}
              disabled={savingCaptains}
              className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingCaptains ? "Saving roster..." : "Save captain roster"}
            </button>
          </div>

          {captainNotice ? (
            <div
              className={`mt-4 rounded-[20px] border px-4 py-3 text-sm ${
                captainNoticeTone === "error"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                  : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {captainNotice}
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Captain roster</p>
                <p className="mt-2 text-sm text-sub">
                  Current seats that will anchor growth pushes, raid direction and community
                  follow-through.
                </p>
              </div>
              <OpsStatusPill tone={roster.length > 0 ? "success" : "default"}>
                {roster.length} assigned
              </OpsStatusPill>
            </div>

            <div className="mt-4 space-y-3">
              {roster.length > 0 ? (
                roster.map((captain) => (
                  <div
                    key={`${captain.authUserId}-${captain.role}`}
                    className="rounded-[22px] border border-line bg-card px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-text">{captain.username}</p>
                        <p className="mt-2 text-sm text-sub">
                          {roleLabel(captain.role)}
                          {captain.label ? ` • ${captain.label}` : ""} • {captain.xp} XP • Trust{" "}
                          {captain.trust}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {captain.walletVerified ? (
                          <OpsStatusPill tone="success">Wallet</OpsStatusPill>
                        ) : (
                          <OpsStatusPill tone="warning">No wallet</OpsStatusPill>
                        )}
                        <OpsStatusPill tone={captain.openFlagCount > 0 ? "warning" : "success"}>
                          {captain.openFlagCount > 0
                            ? `${captain.openFlagCount} open flag${captain.openFlagCount === 1 ? "" : "s"}`
                            : "Quality clean"}
                        </OpsStatusPill>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                      {captain.readinessSummary}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                  No captain seats are assigned yet. Start with one community captain and one raid
                  lead.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Roster editor</p>
                <p className="mt-2 text-sm text-sub">
                  Assign seats from project members or top contributors. Keep this small and
                  deliberate.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setAssignments((current) =>
                    current.length >= 6 ? current : [...current, createEmptyAssignment()]
                  )
                }
                className="rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary"
              >
                Add seat
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {assignments.length > 0 ? (
                assignments.map((assignment, index) => (
                  <div
                    key={`captain-assignment-${index}`}
                    className="rounded-[22px] border border-line bg-card px-4 py-4"
                  >
                    <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                      <label className="space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                        Captain
                        <select
                          value={assignment.authUserId}
                          onChange={(event) =>
                            setAssignments((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, authUserId: event.target.value }
                                  : item
                              )
                            )
                          }
                          className="w-full rounded-[16px] border border-line bg-panel px-4 py-3 text-sm font-medium normal-case tracking-normal text-text"
                        >
                          <option value="">Select a captain</option>
                          {candidates.map((candidate) => (
                            <option key={candidate.authUserId} value={candidate.authUserId}>
                              {candidate.username} • {candidate.source} • Trust {candidate.trust}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                        Role
                        <select
                          value={assignment.role}
                          onChange={(event) =>
                            setAssignments((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? {
                                      ...item,
                                      role: event.target.value as CaptainRole,
                                    }
                                  : item
                              )
                            )
                          }
                          className="w-full rounded-[16px] border border-line bg-panel px-4 py-3 text-sm font-medium normal-case tracking-normal text-text"
                        >
                          <option value="community_captain">Community captain</option>
                          <option value="raid_lead">Raid lead</option>
                          <option value="growth_lead">Growth lead</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3">
                      <label className="min-w-[220px] flex-1 space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                        Label
                        <input
                          value={assignment.label}
                          onChange={(event) =>
                            setAssignments((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, label: event.target.value }
                                  : item
                              )
                            )
                          }
                          placeholder="Optional call-sign"
                          className="w-full rounded-[16px] border border-line bg-panel px-4 py-3 text-sm normal-case tracking-normal text-text"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setAssignments((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index)
                          )
                        }
                        className="self-end rounded-[16px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200 transition hover:border-rose-400/50 hover:text-rose-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                  No seats staged yet. Add a seat and choose a project member or contributor.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
