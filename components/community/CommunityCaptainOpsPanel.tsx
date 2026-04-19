"use client";

import {
  COMMUNITY_CAPTAIN_PERMISSION_LABELS,
  type CommunityCaptainActionRecord,
  type CommunityCaptainPermission,
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
  captainActions: CommunityCaptainActionRecord[];
  saving: boolean;
  notice: string;
  noticeTone: "success" | "error";
  onTogglePermission: (
    authUserId: string,
    permission: CommunityCaptainPermission,
    enabled: boolean
  ) => void;
  onSave: () => void;
};

export function CommunityCaptainOpsPanel({
  roster,
  captainPermissions,
  captainActions,
  saving,
  notice,
  noticeTone,
  onTogglePermission,
  onSave,
}: Props) {
  const permissionLabels = Object.entries(COMMUNITY_CAPTAIN_PERMISSION_LABELS) as Array<
    [CommunityCaptainPermission, string]
  >;
  const activeCaptains = roster.filter((captain) => (captainPermissions[captain.authUserId] ?? []).length > 0).length;

  return (
    <OpsPanel
      eyebrow="Captain Ops"
      title="Captain permissions and action rail"
      description="This turns captain seats into real operator roles. Permissions stay explicit, project-private and fully traceable."
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
            label="Permissioned captains"
            value={activeCaptains}
            sub="Seats currently able to trigger at least one action."
            emphasis={activeCaptains > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Recent captain actions"
            value={captainActions.length}
            sub="Latest project-scoped captain-triggered execution logs."
          />
          <OpsMetricCard
            label="Flags on captains"
            value={roster.filter((captain) => captain.openFlagCount > 0).length}
            sub="Captains carrying open trust or review pressure."
            emphasis={roster.some((captain) => captain.openFlagCount > 0) ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            {roster.length > 0 ? (
              roster.map((captain) => {
                const selectedPermissions = captainPermissions[captain.authUserId] ?? [];

                return (
                  <div
                    key={`${captain.authUserId}-${captain.role}`}
                    className="rounded-[24px] border border-line bg-card2 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-text">{captain.username}</p>
                        <p className="mt-2 text-sm text-sub">
                          {captain.role.replaceAll("_", " ")} • {captain.xp} XP • Trust {captain.trust}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <OpsStatusPill tone={captain.walletVerified ? "success" : "warning"}>
                          {captain.walletVerified ? "Wallet ready" : "Wallet missing"}
                        </OpsStatusPill>
                        <OpsStatusPill tone={captain.openFlagCount > 0 ? "warning" : "success"}>
                          {captain.openFlagCount > 0 ? `${captain.openFlagCount} flag` : "Clean"}
                        </OpsStatusPill>
                      </div>
                    </div>

                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                      {captain.readinessSummary}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {permissionLabels.map(([permission, label]) => (
                        <label
                          key={`${captain.authUserId}-${permission}`}
                          className="flex items-center gap-3 rounded-[18px] border border-line bg-card px-4 py-3 text-sm text-text"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission)}
                            onChange={(event) =>
                              onTogglePermission(captain.authUserId, permission, event.target.checked)
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
              <div className="rounded-[24px] border border-dashed border-line bg-card2 px-4 py-5 text-sm text-sub">
                No captain seats are assigned yet. Add seats first, then grant explicit permissions here.
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <p className="text-sm font-bold text-text">Captain action history</p>
            <p className="mt-2 text-sm text-sub">
              Every captain-triggered action lands here so the project team can audit who ran what.
            </p>

            <div className="mt-4 space-y-3">
              {captainActions.length > 0 ? (
                captainActions.map((action) => (
                  <div key={action.id} className="rounded-[20px] border border-line bg-card px-4 py-4">
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
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                      {action.captainRole || "captain"} • {new Date(action.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
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
                ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
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
