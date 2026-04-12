"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import ActivityChart from "@/components/charts/activity/ActivityChart";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function AnalyticsUsersPage() {
  const users = useAdminPortalStore((s) => s.users);

  const activeUsers = users.filter((user) => user.status === "active");
  const flaggedUsers = users.filter((user) => user.status === "flagged");
  const avgLevel =
    users.length > 0
      ? Math.round(users.reduce((sum, user) => sum + user.level, 0) / users.length)
      : 0;
  const avgTrust =
    users.length > 0
      ? Math.round(users.reduce((sum, user) => sum + user.trustScore, 0) / users.length)
      : 0;
  const topTiers = summarizeByLabel(users.map((user) => user.contributionTier));

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            User Analytics
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Users</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-sub">
            This view shows contributor quality, tier mix and trust posture instead of only raw
            account counts.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">User Snapshot</h2>
            <div className="mt-5">
              <ActivityChart
                items={[
                  { label: "Total Users", value: users.length },
                  { label: "Flagged", value: flaggedUsers.length },
                  { label: "Active", value: activeUsers.length },
                  { label: "Avg Level", value: avgLevel },
                  { label: "Avg Trust", value: avgTrust },
                ]}
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Contribution Tiers</h2>
            <div className="mt-5">
              <ActivityChart items={topTiers.map((item) => ({ label: item.label, value: item.value }))} />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <h2 className="text-xl font-extrabold text-text">Top Contributors</h2>
          <div className="mt-5 overflow-hidden rounded-[24px] border border-line bg-card2">
            <div className="grid grid-cols-6 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
              <div>User</div>
              <div>Tier</div>
              <div>XP</div>
              <div>Trust</div>
              <div>Sybil</div>
              <div>Completed</div>
            </div>

            {users
              .slice()
              .sort((a, b) => b.xp - a.xp || b.trustScore - a.trustScore)
              .slice(0, 8)
              .map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-6 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
                >
                  <div className="font-semibold">{user.username}</div>
                  <div className="capitalize">{user.contributionTier}</div>
                  <div>{user.xp}</div>
                  <div>{user.trustScore}</div>
                  <div>{user.sybilScore}</div>
                  <div>{user.questsCompleted + user.raidsCompleted}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function summarizeByLabel(labels: string[]) {
  const counts = labels.reduce((acc, label) => {
    acc.set(label, (acc.get(label) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
