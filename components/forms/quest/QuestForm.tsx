"use client";

import { useState } from "react";
import { AdminQuest } from "@/types/entities/quest";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type Props = {
  initialValues?: Omit<AdminQuest, "id">;
  onSubmit: (values: Omit<AdminQuest, "id">) => void;
  submitLabel?: string;
};

export default function QuestForm({
  initialValues,
  onSubmit,
  submitLabel = "Save Quest",
}: Props) {
  const campaigns = useAdminPortalStore((s) => s.campaigns);

  const [values, setValues] = useState<Omit<AdminQuest, "id">>(
    initialValues || {
      title: "",
      campaignId: campaigns[0]?.id || "",
      type: "social",
      status: "draft",
      xp: 30,
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
        <Field label="Quest Title">
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

        <Field label="Type">
          <select
            value={values.type}
            onChange={(e) =>
              setValues({
                ...values,
                type: e.target.value as AdminQuest["type"],
              })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            <option value="social">social</option>
            <option value="proof">proof</option>
            <option value="on-chain">on-chain</option>
            <option value="referral">referral</option>
          </select>
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(e) =>
              setValues({
                ...values,
                status: e.target.value as AdminQuest["status"],
              })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
          </select>
        </Field>

        <Field label="XP Reward">
          <input
            type="number"
            value={values.xp}
            onChange={(e) =>
              setValues({ ...values, xp: Number(e.target.value) })
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