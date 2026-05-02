"use client";

import {
  COMMUNITY_CAPTAIN_DUE_STATE_LABELS,
  COMMUNITY_CAPTAIN_PERMISSION_LABELS,
  COMMUNITY_CAPTAIN_RESOLUTION_LABELS,
  COMMUNITY_CAPTAIN_SEAT_SCOPE_LABELS,
  type CommunityCaptainActionRecord,
  type CommunityCaptainPermission,
  type CommunityCaptainSeatScope,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type CaptainCard = {
  authUserId: string;
  role: "community_captain" | "raid_lead" | "growth_lead";
  label: string;
  username: string;
  xp: number;
  trust: number;
  linkedProviders: string[];
  walletVerified: boolean;
  openFlagCount: number;
  readinessSummary: string;
};

type Props = {
  roster: CaptainCard[];
  captainPermissions: Record<string, CommunityCaptainPermission[]>;
  captainSeatScopes: Record<string, CommunityCaptainSeatScope>;
  captainActions: CommunityCaptainActionRecord[];
  saving: boolean;
  notice: string;
  noticeTone: "success" | "error";
  onTogglePermission: (
    authUserId: string,
    role: CaptainCard["role"],
    permission: CommunityCaptainPermission,
    enabled: boolean
  ) => void;
  onUpdateScope: (
    authUserId: string,
    role: CaptainCard["role"],
    scope: CommunityCaptainSeatScope
  ) => void;
  onSave: () => void;
};

function buildCaptainSeatKey(authUserId: string, role: CaptainCard["role"]) {
  return `${authUserId}:${role}`;
}

function defaultScopeForRole(role: CaptainCard["role"]): CommunityCaptainSeatScope {
  if (role === "raid_lead") return "community_only";
  if (role === "growth_lead") return "project_only";
  return "project_and_community";
}

function roleLabel(role: CaptainCard["role"]) {
  if (role === "raid_lead") return "Raid lead";
  if (role === "growth_lead") return "Growth lead";
  return "Community captain";
}

export function CommunityCaptainOpsPanel({
  roster,
  captainPermissions,
  captainSeatScopes,
  captainActions,
  saving,
  notice,
  noticeTone,
  onTogglePermission,
  onUpdateScope,
  onSave,
}: Props) {
  const permissionLabels = Object.entries(COMMUNITY_CAPTAIN_PERMISSION_LABELS) as Array<
    [CommunityCaptainPermission, string]
  >;
  const permissionedCaptains = roster.filter(
    (captain) =>
      (captainPermissions[buildCaptainSeatKey(captain.authUserId, captain.role)] ?? []).length > 0
  ).length;
  const recentFailures = captainActions.filter((action) => action.status === "failed").length;
  const overdueResults = captainActions.filter((action) => action.dueState === "overdue").length;

  return (
    <OpsPanel
      eyebrow="Captain Ops"
      title="Captain permissions and accountability rail"
      description="This turns captain seats into bounded operator roles. Permissions stay explicit, project-private and fully traceable."
      action={
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving permissions..." : "Save captain permissions"}
        </button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard
            label="Captain seats"
            value={roster.length}
            sub="Assigned seats that can carry explicit operator rights."
            emphasis={roster.length > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Permissioned seats"
            value={permissionedCaptains}
            sub="Seats currently able to trigger at least one action."
            emphasis={permissionedCaptains > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Recent captain actions"
            value={captainActions.length}
            sub="Latest project-scoped captain-triggered execution logs."
            emphasis={captainActions.length > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="At-risk results"
            value={recentFailures + overdueResults}
            sub="Recent failed or overdue captain execution outcomes."
            emphasis={recentFailures + overdueResults > 0 ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            {roster.length > 0 ? (
              roster.map((captain) => {
                const seatKey = buildCaptainSeatKey(captain.authUserId, captain.role);
                const selectedPermissions = captainPermissions[seatKey] ?? [];
                const seatScope =
                  captainSeatScopes[seatKey] ?? defaultScopeForRole(captain.role);

                return (
                  <div
                    key={`${captain.authUserId}-${captain.role}`}
                    className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-text">{captain.username}</p>
                        <p className="mt-2 text-sm text-sub">
                          {roleLabel(captain.role)}
                          {captain.label ? ` · ${captain.label}` : ""} · {captain.xp} XP · Trust{" "}
                          {captain.trust}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <OpsStatusPill tone={captain.walletVerified ? "success" : "warning"}>
                          {captain.walletVerified ? "Wallet ready" : "Wallet missing"}
                        </OpsStatusPill>
                        <OpsStatusPill tone={captain.openFlagCount > 0 ? "warning" : "success"}>
                          {captain.openFlagCount > 0 ? `${captain.openFlagCount} flag` : "Clean"}
                        </OpsStatusPill>
                        <OpsStatusPill tone={selectedPermissions.length > 0 ? "success" : "default"}>
                          {selectedPermissions.length} permission
                          {selectedPermissions.length === 1 ? "" : "s"}
                        </OpsStatusPill>
                        <OpsStatusPill tone="default">
                          {COMMUNITY_CAPTAIN_SEAT_SCOPE_LABELS[seatScope]}
                        </OpsStatusPill>
                      </div>
                    </div>

                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                      {captain.readinessSummary}
                    </p>

                    <div className="mt-4 rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-4 py-4">
                      <label className="space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                        Seat scope
                        <select
                          value={seatScope}
                          onChange={(event) =>
                            onUpdateScope(
                              captain.authUserId,
                              captain.role,
                              event.target.value as CommunityCaptainSeatScope
                            )
                          }
                          className="w-full rounded-[16px] border border-white/[0.026] bg-panel px-4 py-3 text-sm font-medium normal-case tracking-normal text-text"
                        >
                          <option value="project_only">Project only</option>
                          <option value="community_only">Community only</option>
                          <option value="project_and_community">Project + community</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {permissionLabels.map(([permission, label]) => (
                        <label
                          key={`${captain.authUserId}-${permission}`}
                          className="flex items-center gap-3 rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission)}
                            onChange={(event) =>
                              onTogglePermission(
                                captain.authUserId,
                                captain.role,
                                permission,
                                event.target.checked
                              )
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[18px] border border-dashed border-white/[0.028] bg-white/[0.014] px-4 py-5 text-sm text-sub">
                No captain seats are assigned yet. Add seats first, then grant explicit permissions here.
              </div>
            )}
          </div>

          <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5">
            <p className="text-sm font-bold text-text">Captain action history</p>
            <p className="mt-2 text-sm text-sub">
              Every captain-triggered action lands here so the project team can audit who ran what, when, and with what outcome.
            </p>

            <div className="mt-4 space-y-3">
              {captainActions.length > 0 ? (
                captainActions.map((action) => (
                  <div key={action.id} className="rounded-[20px] border border-white/[0.026] bg-white/[0.012] px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-text">{action.actionType.replaceAll("_", " ")}</p>
                        <p className="mt-2 text-sm leading-6 text-sub">
                          {action.summary || "No summary recorded."}
                        </p>
                      </div>
                      <OpsStatusPill
                        tone={
                          action.status === "success"
                            ? "success"
                            : action.status === "failed"
                              ? "warning"
                              : "default"
                        }
                      >
                        {action.status}
                      </OpsStatusPill>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-sub">
                      <span className="rounded-full border border-white/[0.032] bg-white/[0.014] px-3 py-1">
                        {action.actorScope || "captain"}
                      </span>
                      <span className="rounded-full border border-white/[0.032] bg-white/[0.014] px-3 py-1">
                        {action.captainRole || "captain"}
                      </span>
                      {action.dueState ? (
                        <span className="rounded-full border border-white/[0.032] bg-white/[0.014] px-3 py-1">
                          {COMMUNITY_CAPTAIN_DUE_STATE_LABELS[action.dueState]}
                        </span>
                      ) : null}
                      {action.resolutionState ? (
                        <span className="rounded-full border border-white/[0.032] bg-white/[0.014] px-3 py-1">
                          {COMMUNITY_CAPTAIN_RESOLUTION_LABELS[action.resolutionState]}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                      {new Date(action.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-white/[0.026] bg-white/[0.01] px-4 py-5 text-sm text-sub">
                  No captain-triggered actions are logged yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {notice ? (
          <div
            className={`rounded-[20px] border px-4 py-3 text-sm ${
              noticeTone === "error"
                ? "border-rose-500/30 bg-rose-500/[0.055] text-rose-200"
                : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {notice}
          </div>
        ) : null}
      </div>
    </OpsPanel>
  );
}
