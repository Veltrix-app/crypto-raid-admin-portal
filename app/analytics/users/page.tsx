"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import ActivityChart from "@/components/charts/activity/ActivityChart";
import { mockUsers } from "@/data/mock/users";

export default function AnalyticsUsersPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            User Analytics
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Users</h1>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <h2 className="text-xl font-extrabold text-text">User Snapshot</h2>
          <div className="mt-5">
            <ActivityChart
              items={[
                { label: "Total Users", value: mockUsers.length },
                {
                  label: "Flagged",
                  value: mockUsers.filter((u) => u.status === "flagged").length,
                },
                {
                  label: "Active",
                  value: mockUsers.filter((u) => u.status === "active").length,
                },
                {
                  label: "Avg Level",
                  value:
                    mockUsers.length > 0
                      ? Math.round(
                          mockUsers.reduce((sum, user) => sum + user.level, 0) /
                            mockUsers.length
                        )
                      : 0,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}