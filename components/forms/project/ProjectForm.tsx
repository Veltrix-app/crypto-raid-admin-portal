"use client";

import { useState } from "react";
import { AdminProject } from "@/types/entities/project";

type Props = {
  initialValues?: Omit<AdminProject, "id">;
  onSubmit: (values: Omit<AdminProject, "id">) => void;
  submitLabel?: string;
};

export default function ProjectForm({
  initialValues,
  onSubmit,
  submitLabel = "Save Project",
}: Props) {
  const [values, setValues] = useState<Omit<AdminProject, "id">>(
    initialValues || {
      name: "",
      chain: "Base",
      status: "draft",
      members: 0,
      campaigns: 0,
      logo: "🚀",
      website: "",
      contactEmail: "",
      description: "",
      onboardingStatus: "draft",
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
        <Field label="Project Name">
          <input
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            required
          />
        </Field>

        <Field label="Chain">
          <select
            value={values.chain}
            onChange={(e) => setValues({ ...values, chain: e.target.value })}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            <option>Base</option>
            <option>Ethereum</option>
            <option>Solana</option>
            <option>BNB Chain</option>
            <option>Arbitrum</option>
          </select>
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(e) =>
              setValues({
                ...values,
                status: e.target.value as AdminProject["status"],
              })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
          </select>
        </Field>

        <Field label="Onboarding Status">
          <select
            value={values.onboardingStatus}
            onChange={(e) =>
              setValues({
                ...values,
                onboardingStatus: e.target.value as AdminProject["onboardingStatus"],
              })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            <option value="draft">draft</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
          </select>
        </Field>

        <Field label="Logo / Emoji">
          <input
            value={values.logo}
            onChange={(e) => setValues({ ...values, logo: e.target.value })}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </Field>

        <Field label="Website">
          <input
            value={values.website}
            onChange={(e) => setValues({ ...values, website: e.target.value })}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </Field>

        <Field label="Contact Email">
          <input
            type="email"
            value={values.contactEmail}
            onChange={(e) => setValues({ ...values, contactEmail: e.target.value })}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </Field>

        <Field label="Members">
          <input
            type="number"
            value={values.members}
            onChange={(e) =>
              setValues({ ...values, members: Number(e.target.value) })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </Field>

        <Field label="Campaign Count">
          <input
            type="number"
            value={values.campaigns}
            onChange={(e) =>
              setValues({ ...values, campaigns: Number(e.target.value) })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          rows={5}
          className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
        />
      </Field>

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