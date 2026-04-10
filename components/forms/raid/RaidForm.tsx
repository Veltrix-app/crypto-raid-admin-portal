"use client";

import { useMemo, useState } from "react";
import { AdminRaid } from "@/types/entities/raid";
import { AdminProject } from "@/types/entities/project";
import { AdminCampaign } from "@/types/entities/campaign";

type Props = {
  projects: AdminProject[];
  campaigns: AdminCampaign[];
  initialValues?: Omit<AdminRaid, "id">;
  onSubmit: (values: Omit<AdminRaid, "id">) => void | Promise<void>;
  submitLabel?: string;
};

export default function RaidForm({
  projects,
  campaigns,
  initialValues,
  onSubmit,
  submitLabel = "Save Raid",
}: Props) {
  const [values, setValues] = useState<Omit<AdminRaid, "id">>(
    initialValues || {
      projectId: projects[0]?.id || "",
      campaignId: "",

      title: "",
      shortDescription: "",
      community: "",
      target: "",

      banner: "",

      rewardXp: 0,
      participants: 0,
      progress: 0,
      timer: "",

      platform: "x",

      targetUrl: "",
      targetPostId: "",
      targetAccountHandle: "",

      verificationType: "manual_confirm",
      verificationConfig: "",

      instructions: [""],

      startsAt: "",
      endsAt: "",

      status: "draft",
    }
  );

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => campaign.projectId === values.projectId);
  }, [campaigns, values.projectId]);

  function updateInstruction(index: number, nextValue: string) {
    const next = [...values.instructions];
    next[index] = nextValue;
    setValues({ ...values, instructions: next });
  }

  function addInstruction() {
    setValues({ ...values, instructions: [...values.instructions, ""] });
  }

  function removeInstruction(index: number) {
    const next = values.instructions.filter((_, i) => i !== index);
    setValues({ ...values, instructions: next.length ? next : [""] });
  }

  return (
    <form
      className="space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({
          ...values,
          instructions: values.instructions.filter((item) => item.trim().length > 0),
        });
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

          <Field label="Raid Title">
            <input
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              required
            />
          </Field>

          <Field label="Community">
            <input
              value={values.community}
              onChange={(e) => setValues({ ...values, community: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="Pepe Raiders"
              required
            />
          </Field>
        </div>

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

        <Field label="Target">
          <textarea
            value={values.target}
            onChange={(e) => setValues({ ...values, target: e.target.value })}
            rows={4}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="Like, repost and drop a funny comment."
            required
          />
        </Field>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Media
        </p>

        <Field label="Banner URL">
          <input
            value={values.banner || ""}
            onChange={(e) => setValues({ ...values, banner: e.target.value })}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            placeholder="https://..."
          />
        </Field>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Raid Settings
        </p>

        <div className="grid gap-5 md:grid-cols-4">
          <Field label="Reward XP">
            <input
              type="number"
              min={0}
              value={values.rewardXp}
              onChange={(e) =>
                setValues({ ...values, rewardXp: Number(e.target.value) })
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

          <Field label="Progress %">
            <input
              type="number"
              min={0}
              max={100}
              value={values.progress}
              onChange={(e) =>
                setValues({ ...values, progress: Number(e.target.value) })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>

          <Field label="Timer Text">
            <input
              value={values.timer || ""}
              onChange={(e) => setValues({ ...values, timer: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="18m left"
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Platform
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Platform">
            <select
              value={values.platform}
              onChange={(e) =>
                setValues({
                  ...values,
                  platform: e.target.value as AdminRaid["platform"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="x">x</option>
              <option value="telegram">telegram</option>
              <option value="discord">discord</option>
              <option value="website">website</option>
              <option value="reddit">reddit</option>
              <option value="custom">custom</option>
            </select>
          </Field>

          <Field label="Target URL">
            <input
              value={values.targetUrl || ""}
              onChange={(e) =>
                setValues({ ...values, targetUrl: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://..."
            />
          </Field>

          <Field label="Target Post ID">
            <input
              value={values.targetPostId || ""}
              onChange={(e) =>
                setValues({ ...values, targetPostId: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            />
          </Field>

          <Field label="Target Account Handle">
            <input
              value={values.targetAccountHandle || ""}
              onChange={(e) =>
                setValues({ ...values, targetAccountHandle: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="@project"
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Verification
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Verification Type">
            <select
              value={values.verificationType}
              onChange={(e) =>
                setValues({
                  ...values,
                  verificationType: e.target.value as AdminRaid["verificationType"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="manual_confirm">manual_confirm</option>
              <option value="api_follow_check">api_follow_check</option>
              <option value="api_like_check">api_like_check</option>
              <option value="api_repost_check">api_repost_check</option>
              <option value="telegram_bot_check">telegram_bot_check</option>
              <option value="discord_role_check">discord_role_check</option>
              <option value="url_click">url_click</option>
            </select>
          </Field>

          <Field label="Verification Config (JSON)">
            <textarea
              value={values.verificationConfig || ""}
              onChange={(e) =>
                setValues({ ...values, verificationConfig: e.target.value })
              }
              rows={4}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder='{"key":"value"}'
            />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Instructions
        </p>

        <div className="space-y-3 rounded-[24px] border border-line bg-card2 p-4">
          {values.instructions.map((instruction, index) => (
            <div key={index} className="flex gap-3">
              <input
                value={instruction}
                onChange={(e) => updateInstruction(index, e.target.value)}
                className="flex-1 rounded-2xl border border-line bg-card px-4 py-3 outline-none"
                placeholder={`Step ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeInstruction(index)}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-semibold text-rose-300"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addInstruction}
            className="rounded-2xl border border-line bg-card px-4 py-3 font-semibold text-text"
          >
            Add Step
          </button>
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
                  status: e.target.value as AdminRaid["status"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="ended">ended</option>
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