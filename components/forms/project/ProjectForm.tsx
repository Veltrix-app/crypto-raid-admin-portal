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
      slug: "",

      chain: "Base",
      category: "",

      status: "draft",
      onboardingStatus: "draft",

      description: "",
      longDescription: "",

      members: 0,
      campaigns: 0,

      logo: "🚀",
      bannerUrl: "",

      website: "",
      xUrl: "",
      telegramUrl: "",
      discordUrl: "",

      contactEmail: "",

      isFeatured: false,
      isPublic: true,
    }
  );

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          General
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Project Name">
            <input
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              required
            />
          </Field>

          <Field label="Slug">
            <input
              value={values.slug}
              onChange={(e) => setValues({ ...values, slug: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="pepe-raiders"
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
              <option>Other</option>
            </select>
          </Field>

          <Field label="Category">
            <input
              value={values.category || ""}
              onChange={(e) => setValues({ ...values, category: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="Meme, DeFi, NFT, Gaming..."
            />
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
                  onboardingStatus:
                    e.target.value as AdminProject["onboardingStatus"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="draft">draft</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Branding
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Logo / Emoji">
            <input
              value={values.logo}
              onChange={(e) => setValues({ ...values, logo: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="🚀"
            />
          </Field>

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
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Links
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Website">
            <input
              value={values.website || ""}
              onChange={(e) => setValues({ ...values, website: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://..."
            />
          </Field>

          <Field label="Contact Email">
            <input
              type="email"
              value={values.contactEmail || ""}
              onChange={(e) =>
                setValues({ ...values, contactEmail: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="team@project.com"
            />
          </Field>

          <Field label="X URL">
            <input
              value={values.xUrl || ""}
              onChange={(e) => setValues({ ...values, xUrl: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://x.com/..."
            />
          </Field>

          <Field label="Telegram URL">
            <input
              value={values.telegramUrl || ""}
              onChange={(e) =>
                setValues({ ...values, telegramUrl: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://t.me/..."
            />
          </Field>

          <Field label="Discord URL">
            <input
              value={values.discordUrl || ""}
              onChange={(e) =>
                setValues({ ...values, discordUrl: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://discord.gg/..."
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Content
        </p>

        <Field label="Description">
          <textarea
            value={values.description}
            onChange={(e) =>
              setValues({ ...values, description: e.target.value })
            }
            rows={5}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="Short project description..."
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
            placeholder="Longer project overview, mission, value proposition..."
          />
        </Field>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Metrics
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Members">
            <input
              type="number"
              value={values.members}
              onChange={(e) =>
                setValues({ ...values, members: Number(e.target.value) })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              min={0}
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
              min={0}
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
            label="Featured Project"
            checked={values.isFeatured || false}
            onChange={(checked) =>
              setValues({ ...values, isFeatured: checked })
            }
          />

          <ToggleField
            label="Public Project"
            checked={values.isPublic ?? true}
            onChange={(checked) =>
              setValues({ ...values, isPublic: checked })
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