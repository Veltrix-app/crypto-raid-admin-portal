"use client";

import { useState } from "react";
import { AdminRaid } from "@/types/entities/raid";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type Props = {
  initialValues?: Omit<AdminRaid, "id">;
  onSubmit: (values: Omit<AdminRaid, "id">) => void;
  submitLabel?: string;
};

export default function RaidForm({
  initialValues,
  onSubmit,
  submitLabel = "Save Raid",
}: Props) {
  const campaigns = useAdminPortalStore((s) => s.campaigns);

  const [values, setValues] = useState<Omit<AdminRaid, "id">>(
    initialValues || {
      title: "",
      campaignId: campaigns[0]?.id || "",
      status: "scheduled",
      participants: 0,
      rewardXp: 40,
    }
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Raid Title">
          <input
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            required
          />
        </Field>

        <Field label="Campaign">
          <select
            value={values.campaignId}
            onChange={(e) => setValues({ ...values, campaignId: e.target.value })}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(e) =>
              setValues({
                ...values,
                status: e.target.value as AdminRaid["status"],
              })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            <option value="scheduled">scheduled</option>
            <option value="live">live</option>
            <option value="ended">ended</option>
          </select>
        </Field>

        <Field label="Participants">
          <input
            type="number"
            value={values.participants}
            onChange={(e) =>
              setValues({ ...values, participants: Number(e.target.value) })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </Field>

        <Field label="Reward XP">
          <input
            type="number"
            value={values.rewardXp}
            onChange={(e) =>
              setValues({ ...values, rewardXp: Number(e.target.value) })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </Field>
      </div>

      <button className="rounded-2xl bg-primary px-5 py-3 font-bold text-black">
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-text">{label}</span>
      {children}
    </label>
  );
}