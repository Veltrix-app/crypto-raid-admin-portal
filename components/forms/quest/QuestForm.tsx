"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminQuest } from "@/types/entities/quest";
import { AdminProject } from "@/types/entities/project";
import { AdminCampaign } from "@/types/entities/campaign";

type Props = {
  projects: AdminProject[];
  campaigns: AdminCampaign[];
  initialValues?: Omit<AdminQuest, "id">;
  defaultProjectId?: string;
  onSubmit: (values: Omit<AdminQuest, "id">) => void | Promise<void>;
  submitLabel?: string;
};

const QUEST_TYPE_PRESETS: Record<
  AdminQuest["questType"],
  {
    label: string;
    summary: string;
    platform: NonNullable<AdminQuest["platform"]>;
    actionLabel: string;
    proofRequired: boolean;
    proofType: AdminQuest["proofType"];
    verificationType: AdminQuest["verificationType"];
    type: string;
    recommendedConfig: string;
  }
> = {
  social_follow: {
    label: "Follow on X",
    summary: "Grow reach by asking contributors to follow a specific X account.",
    platform: "x",
    actionLabel: "Follow Account",
    proofRequired: false,
    proofType: "none",
    verificationType: "api_check",
    type: "Social",
    recommendedConfig: '{\n  "handle": "@veltrixapp"\n}',
  },
  social_like: {
    label: "Like a Post",
    summary: "Send users to a key announcement or launch post and track the engagement.",
    platform: "x",
    actionLabel: "Like Post",
    proofRequired: false,
    proofType: "none",
    verificationType: "api_check",
    type: "Social",
    recommendedConfig: '{\n  "postUrl": "https://x.com/..."\n}',
  },
  social_repost: {
    label: "Repost a Post",
    summary: "Amplify campaign messages with repost-driven reach.",
    platform: "x",
    actionLabel: "Repost Post",
    proofRequired: false,
    proofType: "none",
    verificationType: "api_check",
    type: "Social",
    recommendedConfig: '{\n  "postUrl": "https://x.com/..."\n}',
  },
  social_comment: {
    label: "Comment on X",
    summary: "Drive social proof by sending users to comment on a target post.",
    platform: "x",
    actionLabel: "Comment on Post",
    proofRequired: true,
    proofType: "url",
    verificationType: "manual_review",
    type: "Social",
    recommendedConfig: '{\n  "postUrl": "https://x.com/...",\n  "keyword": "Veltrix"\n}',
  },
  telegram_join: {
    label: "Join Telegram",
    summary: "Route campaign traffic into a Telegram community or announcement hub.",
    platform: "telegram",
    actionLabel: "Join Telegram",
    proofRequired: false,
    proofType: "none",
    verificationType: "bot_check",
    type: "Community",
    recommendedConfig: '{\n  "groupUrl": "https://t.me/..."\n}',
  },
  discord_join: {
    label: "Join Discord",
    summary: "Build owned community presence inside the project's Discord.",
    platform: "discord",
    actionLabel: "Join Discord",
    proofRequired: false,
    proofType: "none",
    verificationType: "bot_check",
    type: "Community",
    recommendedConfig: '{\n  "inviteUrl": "https://discord.gg/..."\n}',
  },
  wallet_connect: {
    label: "Connect Wallet",
    summary: "Use wallet connection as the first trust and identity checkpoint.",
    platform: "wallet",
    actionLabel: "Connect Wallet",
    proofRequired: false,
    proofType: "wallet",
    verificationType: "onchain_check",
    type: "Wallet",
    recommendedConfig: '{\n  "chain": "ethereum"\n}',
  },
  token_hold: {
    label: "Hold Token",
    summary: "Gate campaign progress behind token ownership or balance thresholds.",
    platform: "wallet",
    actionLabel: "Verify Token Holdings",
    proofRequired: false,
    proofType: "wallet",
    verificationType: "onchain_check",
    type: "Wallet",
    recommendedConfig: '{\n  "contractAddress": "0x...",\n  "minimumBalance": 100\n}',
  },
  nft_hold: {
    label: "Hold NFT",
    summary: "Target collectors or holders with ownership-based access.",
    platform: "wallet",
    actionLabel: "Verify NFT",
    proofRequired: false,
    proofType: "wallet",
    verificationType: "onchain_check",
    type: "Wallet",
    recommendedConfig: '{\n  "contractAddress": "0x...",\n  "minimumOwned": 1\n}',
  },
  onchain_tx: {
    label: "Complete Onchain Action",
    summary: "Track a swap, mint or contract interaction with an onchain verifier.",
    platform: "wallet",
    actionLabel: "Complete Onchain Action",
    proofRequired: false,
    proofType: "tx_hash",
    verificationType: "onchain_check",
    type: "Onchain",
    recommendedConfig: '{\n  "contractAddress": "0x...",\n  "method": "swapExactTokensForTokens"\n}',
  },
  url_visit: {
    label: "Visit Page",
    summary: "Send users into landing pages, docs or partner experiences.",
    platform: "website",
    actionLabel: "Open Page",
    proofRequired: false,
    proofType: "none",
    verificationType: "event_check",
    type: "Traffic",
    recommendedConfig: '{\n  "targetUrl": "https://veltrix.app/docs"\n}',
  },
  referral: {
    label: "Invite Friends",
    summary: "Turn contributors into growth channels with referral-based quests.",
    platform: "custom",
    actionLabel: "Share Referral Link",
    proofRequired: false,
    proofType: "text",
    verificationType: "hybrid",
    type: "Growth",
    recommendedConfig: '{\n  "minimumReferrals": 3\n}',
  },
  manual_proof: {
    label: "Manual Proof",
    summary: "Collect screenshots, links or written proof for custom actions.",
    platform: "custom",
    actionLabel: "Submit Proof",
    proofRequired: true,
    proofType: "image",
    verificationType: "manual_review",
    type: "Proof",
    recommendedConfig: '{\n  "instructions": "Upload a screenshot that clearly shows completion."\n}',
  },
  custom: {
    label: "Custom Task",
    summary: "Use a flexible template when the quest doesn't fit a standard mechanic yet.",
    platform: "custom",
    actionLabel: "Open Task",
    proofRequired: true,
    proofType: "text",
    verificationType: "manual_review",
    type: "Custom",
    recommendedConfig: '{\n  "notes": "Define your own verification rules."\n}',
  },
};

export default function QuestForm({
  projects,
  campaigns,
  initialValues,
  defaultProjectId,
  onSubmit,
  submitLabel = "Save Quest",
}: Props) {
  const [values, setValues] = useState<Omit<AdminQuest, "id">>(
    initialValues || {
      projectId: defaultProjectId || projects[0]?.id || "",
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
  const [selectedPreset, setSelectedPreset] = useState<AdminQuest["questType"]>(
    initialValues?.questType || "custom"
  );

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => campaign.projectId === values.projectId);
  }, [campaigns, values.projectId]);
  const activePreset = QUEST_TYPE_PRESETS[selectedPreset];
  const selectedProject = projects.find((project) => project.id === values.projectId);

  useEffect(() => {
    if (!values.projectId && defaultProjectId) {
      setValues((current) => ({ ...current, projectId: defaultProjectId }));
    }
  }, [defaultProjectId, values.projectId]);

  useEffect(() => {
    if (!filteredCampaigns.length) {
      if (values.campaignId) {
        setValues((current) => ({ ...current, campaignId: "" }));
      }
      return;
    }

    const hasSelectedCampaign = filteredCampaigns.some(
      (campaign) => campaign.id === values.campaignId
    );

    if (!hasSelectedCampaign) {
      setValues((current) => ({
        ...current,
        campaignId: filteredCampaigns[0]?.id || "",
      }));
    }
  }, [filteredCampaigns, values.campaignId]);

  function applyPreset(questType: AdminQuest["questType"]) {
    const preset = QUEST_TYPE_PRESETS[questType];
    setSelectedPreset(questType);
    setValues((current) => ({
      ...current,
      questType,
      platform: preset.platform,
      actionLabel: preset.actionLabel,
      proofRequired: preset.proofRequired,
      proofType: preset.proofType,
      verificationType: preset.verificationType,
      verificationConfig:
        current.verificationConfig?.trim() && current.questType === questType
          ? current.verificationConfig
          : preset.recommendedConfig,
      type: preset.type,
    }));
  }

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
          Quest Blueprint
        </p>

        <div className="grid gap-3 xl:grid-cols-2">
          {(
            [
              "social_follow",
              "telegram_join",
              "wallet_connect",
              "token_hold",
              "referral",
              "manual_proof",
            ] as AdminQuest["questType"][]
          ).map((questType) => {
            const preset = QUEST_TYPE_PRESETS[questType];
            const isActive = values.questType === questType;

            return (
              <button
                key={questType}
                type="button"
                onClick={() => applyPreset(questType)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-line bg-card2 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-bold text-text">{preset.label}</p>
                <p className="mt-2 text-sm leading-6 text-sub">{preset.summary}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-line bg-card2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">{activePreset.label}</p>
              <p className="mt-2 text-sm leading-6 text-sub">{activePreset.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em]">
              <span className="rounded-full bg-white/5 px-3 py-1 text-text">{activePreset.type}</span>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">{activePreset.platform}</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-text">{activePreset.verificationType}</span>
            </div>
          </div>
        </div>
      </div>

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

        {selectedProject ? (
          <p className="text-sm text-sub">
            This quest will be created inside <span className="font-semibold text-text">{selectedProject.name}</span>
            {filteredCampaigns.length
              ? ` with ${filteredCampaigns.length} available campaign${filteredCampaigns.length === 1 ? "" : "s"} in this workspace.`
              : " but this project still needs a campaign before the quest can go live."}
          </p>
        ) : null}

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
                applyPreset(e.target.value as AdminQuest["questType"])
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

        <div className="rounded-2xl border border-line bg-card2 p-4 text-sm text-sub">
          <span className="font-semibold text-text">Builder hint:</span> use the action label and URL as the exact CTA contributors will see in the app. For social or onchain quests, point this directly at the target destination so the flow feels one-tap.
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
                placeholder={activePreset.recommendedConfig}
              />
            </Field>
            <p className="mt-2 text-sm text-sub">
              Start from the recommended config for <span className="font-semibold text-text">{activePreset.label}</span> and adjust the values to match this campaign.
            </p>
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
