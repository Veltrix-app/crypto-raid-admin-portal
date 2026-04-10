"use client";

import { useState } from "react";
import { AdminCampaign } from "@/types/entities/campaign";
import { AdminProject } from "@/types/entities/project";

type Props = {
  projects: AdminProject[];
  initialValues?: Omit<AdminCampaign, "id">;
  onSubmit: (values: Omit<AdminCampaign, "id">) => void | Promise<void>;
  submitLabel?: string;
};

export default function CampaignForm({
  projects,
  initialValues,
  onSubmit,
  submitLabel = "Save Campaign",
}: Props) {
  const [values, setValues] = useState<Omit<AdminCampaign, "id">>(
    initialValues || {
      projectId: projects[0]?.id || "",

      title: "",
      slug: "",

      shortDescription: "",
      longDescription: "",

      bannerUrl: "",
      thumbnailUrl: "",

      campaignType: "hybrid",

      xpBudget: 0,
      participants: 0,
      completionRate: 0,

      visibility: "public",
      featured: false,

      startsAt: "",
      endsAt: "",

      status: "draft",
    }
  );

  return (
    <form
      className="space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(values);
      }}
    >
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          General
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Project">
            <select
              value={values.projectId}
              onChange={(e) =>
                setValues({ ...values, projectId: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              required
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Campaign Title">
            <input
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              required
            />
          </Field>

          <Field label="Slug">
            <input
              value={values.slug}
              onChange={(e) => setValues({ ...values, slug: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="weekly-meme-push"
              required
            />
          </Field>

          <Field label="Campaign Type">
            <select
              value={values.campaignType}
              onChange={(e) =>
                setValues({
                  ...values,
                  campaignType: e.target.value as AdminCampaign["campaignType"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="social_growth">social_growth</option>
              <option value="community_growth">community_growth</option>
              <option value="onchain">onchain</option>
              <option value="referral">referral</option>
              <option value="content">content</option>
              <option value="hybrid">hybrid</option>
            </select>
          </Field>

          <Field label="Visibility">
            <select
              value={values.visibility}
              onChange={(e) =>
                setValues({
                  ...values,
                  visibility: e.target.value as AdminCampaign["visibility"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="public">public</option>
              <option value="private">private</option>
              <option value="gated">gated</option>
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
              <option value="scheduled">scheduled</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="completed">completed</option>
              <option value="archived">archived</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Content
        </p>

        <Field label="Short Description">
          <textarea
            value={values.shortDescription}
            onChange={(e) =>
              setValues({ ...values, shortDescription: e.target.value })
            }
            rows={4}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            required
          />
        </Field>

        <Field label="Long Description">
          <textarea
            value={values.longDescription || ""}
            onChange={(e) =>
              setValues({ ...values, longDescription: e.target.value })
            }
            rows={8}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </Field>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Media
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Banner URL">
            <input
              value={values.bannerUrl || ""}
              onChange={(e) =>
                setValues({ ...values, bannerUrl: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://..."
            />
          </Field>

          <Field label="Thumbnail URL">
            <input
              value={values.thumbnailUrl || ""}
              onChange={(e) =>
                setValues({ ...values, thumbnailUrl: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://..."
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Campaign Settings
        </p>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="XP Budget">
            <input
              type="number"
              min={0}
              value={values.xpBudget}
              onChange={(e) =>
                setValues({ ...values, xpBudget: Number(e.target.value) })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>

          <Field label="Participants">
            <input
              type="number"
              min={0}
              value={values.participants}
              onChange={(e) =>
                setValues({ ...values, participants: Number(e.target.value) })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>

          <Field label="Completion Rate">
            <input
              type="number"
              min={0}
              max={100}
              value={values.completionRate}
              onChange={(e) =>
                setValues({ ...values, completionRate: Number(e.target.value) })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Timing
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Starts At">
            <input
              type="datetime-local"
              value={values.startsAt || ""}
              onChange={(e) =>
                setValues({ ...values, startsAt: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>

          <Field label="Ends At">
            <input
              type="datetime-local"
              value={values.endsAt || ""}
              onChange={(e) =>
                setValues({ ...values, endsAt: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Visibility
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <ToggleField
            label="Featured Campaign"
            checked={values.featured}
            onChange={(checked) =>
              setValues({ ...values, featured: checked })
            }
          />
        </div>
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

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-4">
      <span className="text-sm font-semibold text-text">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-lime-400"
      />
    </label>
  );
}