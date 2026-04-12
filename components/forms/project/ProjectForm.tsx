"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminProject } from "@/types/entities/project";

type Props = {
  initialValues?: Omit<AdminProject, "id">;
  onSubmit: (values: Omit<AdminProject, "id">) => void;
  submitLabel?: string;
};

const defaultValues: Omit<AdminProject, "id"> = {
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
};

export default function ProjectForm({
  initialValues,
  onSubmit,
  submitLabel = "Save Project",
}: Props) {
  const [values, setValues] = useState<Omit<AdminProject, "id">>(initialValues || defaultValues);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));

  useEffect(() => {
    if (slugTouched) return;
    setValues((current) => ({ ...current, slug: slugify(current.name) }));
  }, [slugTouched, values.name]);

  const connectedLinks = useMemo(
    () => [values.website, values.xUrl, values.telegramUrl, values.discordUrl].filter(Boolean).length,
    [values.discordUrl, values.telegramUrl, values.website, values.xUrl]
  );

  const brandingReadiness = [
    {
      label: "Identity",
      value: values.logo && values.name ? "Ready" : "Missing logo or project name",
      complete: Boolean(values.logo && values.name),
    },
    {
      label: "Public copy",
      value: values.description ? "Short profile added" : "Add a short public description",
      complete: Boolean(values.description),
    },
    {
      label: "Distribution links",
      value: connectedLinks > 0 ? `${connectedLinks} channels connected` : "No channels linked yet",
      complete: connectedLinks > 0,
    },
    {
      label: "Visibility",
      value: values.isPublic ? "Workspace can appear publicly" : "Workspace remains private",
      complete: true,
    },
  ];

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">General</p>

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
              onChange={(e) => {
                setSlugTouched(true);
                setValues({ ...values, slug: e.target.value });
              }}
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
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Branding</p>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
                onChange={(e) => setValues({ ...values, bannerUrl: e.target.value })}
                className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
                placeholder="https://..."
              />
            </Field>

            <Field label="Contact Email">
              <input
                type="email"
                value={values.contactEmail || ""}
                onChange={(e) => setValues({ ...values, contactEmail: e.target.value })}
                className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
                placeholder="team@project.com"
              />
            </Field>

            <Field label="Public Handle Hint">
              <input
                value={values.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setValues({ ...values, slug: e.target.value });
                }}
                className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
                placeholder="project-slug"
              />
            </Field>
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Public Profile Preview
            </p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
              <div className="h-28 bg-gradient-to-br from-primary/20 via-card to-card2">
                {values.bannerUrl ? (
                  <img
                    src={values.bannerUrl}
                    alt={`${values.name || "Project"} banner`}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-card2 text-2xl">
                    {values.logo || "🚀"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-text">
                      {values.name || "Project name"}
                    </p>
                    <p className="truncate text-sm text-sub">/{values.slug || "project-slug"}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-sub">
                  {values.description || "Short public description will appear here."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <PreviewBadge>{values.chain}</PreviewBadge>
                  {values.category ? <PreviewBadge>{values.category}</PreviewBadge> : null}
                  <PreviewBadge>{values.isPublic ? "Public" : "Private"}</PreviewBadge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Distribution Links
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
              onChange={(e) => setValues({ ...values, telegramUrl: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://t.me/..."
            />
          </Field>

          <Field label="Discord URL">
            <input
              value={values.discordUrl || ""}
              onChange={(e) => setValues({ ...values, discordUrl: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://discord.gg/..."
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Public Narrative
        </p>

        <Field label="Description">
          <textarea
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
            rows={5}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="Short project description..."
          />
        </Field>

        <Field label="Long Description">
          <textarea
            value={values.longDescription || ""}
            onChange={(e) => setValues({ ...values, longDescription: e.target.value })}
            rows={8}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="Longer project overview, mission, value proposition..."
          />
        </Field>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Metrics</p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Members">
            <input
              type="number"
              value={values.members}
              onChange={(e) => setValues({ ...values, members: Number(e.target.value) })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              min={0}
            />
          </Field>

          <Field label="Campaign Count">
            <input
              type="number"
              value={values.campaigns}
              onChange={(e) => setValues({ ...values, campaigns: Number(e.target.value) })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              min={0}
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Visibility</p>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-5 md:grid-cols-2">
            <ToggleField
              label="Featured Project"
              checked={values.isFeatured || false}
              onChange={(checked) => setValues({ ...values, isFeatured: checked })}
            />

            <ToggleField
              label="Public Project"
              checked={values.isPublic ?? true}
              onChange={(checked) => setValues({ ...values, isPublic: checked })}
            />
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Public Profile Readiness
            </p>

            <div className="mt-4 space-y-3">
              {brandingReadiness.map((item) => (
                <div key={item.label} className="rounded-2xl border border-line bg-card px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-text">{item.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                        item.complete ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {item.complete ? "Ready" : "Needs work"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-sub">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
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

function PreviewBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-card2 px-3 py-1 text-xs font-bold text-text">
      {children}
    </span>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
