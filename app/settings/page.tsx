"use client";

import Link from "next/link";
import AdminShell from "@/components/layout/shell/AdminShell";

export default function SettingsPage() {
  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Workspace Settings
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Settings</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/settings/profile"
            className="rounded-[24px] border border-line bg-card p-6"
          >
            <h2 className="text-xl font-extrabold text-text">Profile</h2>
            <p className="mt-2 text-sm text-sub">Workspace profile and owner details.</p>
          </Link>

          <Link
            href="/settings/team"
            className="rounded-[24px] border border-line bg-card p-6"
          >
            <h2 className="text-xl font-extrabold text-text">Team</h2>
            <p className="mt-2 text-sm text-sub">Invite and manage internal roles.</p>
          </Link>

          <Link
            href="/settings/billing"
            className="rounded-[24px] border border-line bg-card p-6"
          >
            <h2 className="text-xl font-extrabold text-text">Billing</h2>
            <p className="mt-2 text-sm text-sub">Plans, limits and subscription info.</p>
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}