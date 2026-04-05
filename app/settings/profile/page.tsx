"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

export default function SettingsProfilePage() {
  const { email, role } = useAdminAuthStore();

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Workspace Profile
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Profile</h1>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Owner Email" value={email || "admin@portal.com"} />
            <Field label="Role" value={role || "project_admin"} />
            <Field label="Workspace Name" value="Crypto Raid Admin Portal" />
            <Field label="Environment" value="Development" />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card2 px-4 py-4">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 font-bold capitalize text-text">{value}</p>
    </div>
  );
}