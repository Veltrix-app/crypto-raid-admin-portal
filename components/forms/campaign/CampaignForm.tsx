"use client";

import { useState } from "react";
import { AdminCampaign } from "@/types/entities/campaign";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type Props = {
  initialValues?: Omit<AdminCampaign, "id">;
  onSubmit: (values: Omit<AdminCampaign, "id">) => void;
  submitLabel?: string;
};

export default function CampaignForm({
  initialValues,
  onSubmit,
  submitLabel = "Save Campaign",
}: Props) {
  const projects = useAdminPortalStore((s) => s.projects);

  const [values, setValues] = useState<Omit<AdminCampaign, "id">>(
    initialValues || {
      title: "",
      projectId: projects[0]?.id || "",
      status: "draft",
      participants: 0,
      completionRate: 0,
      xpBudget: 5000,
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
        <Field label="Campaign Title">
          <input
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            required
          />
        </Field>

        <Field label="Project">
          <select
            value={values.projectId}
            onChange={(e) => setValues({ ...values, projectId: e.target.value })}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
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
                status: e.target.value as AdminCampaign["status"],
              })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="completed">completed</option>
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

        <Field label="Completion Rate %">
          <input
            type="number"
            value={values.completionRate}
            onChange={(e) =>
              setValues({ ...values, completionRate: Number(e.target.value) })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </Field>

        <Field label="XP Budget">
          <input
            type="number"
            value={values.xpBudget}
            onChange={(e) =>
              setValues({ ...values, xpBudget: Number(e.target.value) })
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