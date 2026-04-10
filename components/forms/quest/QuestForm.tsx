"use client";

import { useMemo, useState } from "react";
import { AdminQuest } from "@/types/entities/quest";
import { AdminProject } from "@/types/entities/project";
import { AdminCampaign } from "@/types/entities/campaign";

type Props = {
  projects: AdminProject[];
  campaigns: AdminCampaign[];
  initialValues?: Omit<AdminQuest, "id">;
  onSubmit: (values: Omit<AdminQuest, "id">) => void | Promise<void>;
  submitLabel?: string;
};

export default function QuestForm({
  projects,
  campaigns,
  initialValues,
  onSubmit,
  submitLabel = "Save Quest",
}: Props) {
  const [values, setValues] = useState<Omit<AdminQuest, "id">>(
    initialValues || {
      projectId: projects[0]?.id || "",
      campaignId: "",

      title: "",
      description: "",
      shortDescription: "",

      type: "Task",
      questType: "custom",
      platform: "custom",

      xp: 0,
      actionLabel: "Open Task",
      actionUrl: "",

      proofRequired: false,
      proofType: "none",

      autoApprove: false,
      verificationType: "manual_review",
      verificationConfig: "",

      isRepeatable: false,
      cooldownSeconds: undefined,
      maxCompletionsPerUser: undefined,
      sortOrder: 0,

      startsAt: "",
      endsAt: "",

      status: "draft",
    }
  );

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => campaign.projectId === values.projectId);
  }, [campaigns, values.projectId]);

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
                setValues({
                  ...values,
                  projectId: e.target.value,
                  campaignId: "",
                })
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

          <Field label="Campaign">
            <select
              value={values.campaignId}
              onChange={(e) => setValues({ ...values, campaignId: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              required
            >
              <option value="">Select campaign</option>
              {filteredCampaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Quest Title">
            <input
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              required
            />
          </Field>

          <Field label="Legacy Type">
            <input
              value={values.type}
              onChange={(e) => setValues({ ...values, type: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="Task"
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
            rows={5}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            required
          />
        </Field>

        <Field label="Short Description">
          <textarea
            value={values.shortDescription || ""}
            onChange={(e) =>
              setValues({ ...values, shortDescription: e.target.value })
            }
            rows={3}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </Field>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Quest Logic
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Quest Type">
            <select
              value={values.questType}
              onChange={(e) =>
                setValues({
                  ...values,
                  questType: e.target.value as AdminQuest["questType"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="social_follow">social_follow</option>
              <option value="social_like">social_like</option>
              <option value="social_repost">social_repost</option>
              <option value="social_comment">social_comment</option>
              <option value="telegram_join">telegram_join</option>
              <option value="discord_join">discord_join</option>
              <option value="wallet_connect">wallet_connect</option>
              <option value="token_hold">token_hold</option>
              <option value="nft_hold">nft_hold</option>
              <option value="onchain_tx">onchain_tx</option>
              <option value="url_visit">url_visit</option>
              <option value="referral">referral</option>
              <option value="manual_proof">manual_proof</option>
              <option value="custom">custom</option>
            </select>
          </Field>

          <Field label="Platform">
            <select
              value={values.platform || "custom"}
              onChange={(e) =>
                setValues({
                  ...values,
                  platform: e.target.value as AdminQuest["platform"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="x">x</option>
              <option value="telegram">telegram</option>
              <option value="discord">discord</option>
              <option value="wallet">wallet</option>
              <option value="website">website</option>
              <option value="custom">custom</option>
            </select>
          </Field>

          <Field label="XP">
            <input
              type="number"
              min={0}
              value={values.xp}
              onChange={(e) =>
                setValues({ ...values, xp: Number(e.target.value) })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>

          <Field label="Action Label">
            <input
              value={values.actionLabel}
              onChange={(e) =>
                setValues({ ...values, actionLabel: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="Open Task"
            />
          </Field>

          <Field label="Action URL">
            <input
              value={values.actionUrl || ""}
              onChange={(e) =>
                setValues({ ...values, actionUrl: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://..."
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Proof & Verification
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <ToggleField
            label="Proof Required"
            checked={values.proofRequired}
            onChange={(checked) =>
              setValues({
                ...values,
                proofRequired: checked,
                proofType: checked ? values.proofType : "none",
              })
            }
          />

          <ToggleField
            label="Auto Approve"
            checked={values.autoApprove}
            onChange={(checked) =>
              setValues({ ...values, autoApprove: checked })
            }
          />

          <Field label="Proof Type">
            <select
              value={values.proofType}
              onChange={(e) =>
                setValues({
                  ...values,
                  proofType: e.target.value as AdminQuest["proofType"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="none">none</option>
              <option value="text">text</option>
              <option value="url">url</option>
              <option value="image">image</option>
              <option value="wallet">wallet</option>
              <option value="tx_hash">tx_hash</option>
            </select>
          </Field>

          <Field label="Verification Type">
            <select
              value={values.verificationType}
              onChange={(e) =>
                setValues({
                  ...values,
                  verificationType: e.target.value as AdminQuest["verificationType"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="api_check">api_check</option>
              <option value="bot_check">bot_check</option>
              <option value="onchain_check">onchain_check</option>
              <option value="event_check">event_check</option>
              <option value="manual_review">manual_review</option>
              <option value="hybrid">hybrid</option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Verification Config (JSON)">
              <textarea
                value={values.verificationConfig || ""}
                onChange={(e) =>
                  setValues({ ...values, verificationConfig: e.target.value })
                }
                rows={5}
                className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
                placeholder='{"key":"value"}'
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Limits
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <ToggleField
            label="Repeatable"
            checked={values.isRepeatable}
            onChange={(checked) =>
              setValues({ ...values, isRepeatable: checked })
            }
          />

          <Field label="Sort Order">
            <input
              type="number"
              min={0}
              value={values.sortOrder}
              onChange={(e) =>
                setValues({ ...values, sortOrder: Number(e.target.value) })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>

          <Field label="Cooldown Seconds">
            <input
              type="number"
              min={0}
              value={values.cooldownSeconds ?? ""}
              onChange={(e) =>
                setValues({
                  ...values,
                  cooldownSeconds:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>

          <Field label="Max Completions Per User">
            <input
              type="number"
              min={0}
              value={values.maxCompletionsPerUser ?? ""}
              onChange={(e) =>
                setValues({
                  ...values,
                  maxCompletionsPerUser:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Timing & Status
        </p>

        <div className="grid gap-5 md:grid-cols-3">
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
              <option value="paused">paused</option>
              <option value="archived">archived</option>
            </select>
          </Field>
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