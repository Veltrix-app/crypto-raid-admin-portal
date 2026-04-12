"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminReward } from "@/types/entities/reward";
import { AdminProject } from "@/types/entities/project";
import { AdminCampaign } from "@/types/entities/campaign";

type Props = {
  projects: AdminProject[];
  campaigns: AdminCampaign[];
  initialValues?: Omit<AdminReward, "id">;
  defaultProjectId?: string;
  onSubmit: (values: Omit<AdminReward, "id">) => void | Promise<void>;
  submitLabel?: string;
};

const REWARD_TYPE_PRESETS: Record<
  AdminReward["rewardType"],
  {
    label: string;
    summary: string;
    claimMethod: AdminReward["claimMethod"];
    rarity: AdminReward["rarity"];
    claimable: boolean;
    type: string;
    recommendedConfig: string;
  }
> = {
  token: {
    label: "Token Reward",
    summary: "Use a token payout when the reward should tie directly into onchain participation and measurable ownership.",
    claimMethod: "wallet_airdrop",
    rarity: "rare",
    claimable: true,
    type: "Token",
    recommendedConfig: '{\n  "asset": "USDC",\n  "network": "base",\n  "amount": 25\n}',
  },
  nft: {
    label: "NFT Reward",
    summary: "Great for collectible utility, campaign memorabilia or proof-of-participation drops.",
    claimMethod: "wallet_airdrop",
    rarity: "epic",
    claimable: true,
    type: "NFT",
    recommendedConfig: '{\n  "contractAddress": "0x...",\n  "collection": "Veltrix Season One"\n}',
  },
  role: {
    label: "Role Unlock",
    summary: "Reward contributors with gated Discord or community access after review or completion.",
    claimMethod: "role_assignment",
    rarity: "common",
    claimable: true,
    type: "Access",
    recommendedConfig: '{\n  "platform": "discord",\n  "roleId": "1234567890"\n}',
  },
  allowlist: {
    label: "Allowlist Spot",
    summary: "Use for product launches, early access drops or partner activations where scarcity matters.",
    claimMethod: "manual_fulfillment",
    rarity: "legendary",
    claimable: true,
    type: "Launch",
    recommendedConfig: '{\n  "collection": "Genesis Mint",\n  "spots": 50\n}',
  },
  access: {
    label: "Access Pass",
    summary: "Useful for gated docs, product betas, alpha channels or private experiences.",
    claimMethod: "code_distribution",
    rarity: "rare",
    claimable: true,
    type: "Access",
    recommendedConfig: '{\n  "delivery": "invite_link",\n  "instructions": "Send beta invite after approval."\n}',
  },
  badge: {
    label: "Badge Unlock",
    summary: "Turn quest completion into visible reputation and progression inside Veltrix.",
    claimMethod: "instant_auto",
    rarity: "common",
    claimable: false,
    type: "Reputation",
    recommendedConfig: '{\n  "badgeSlug": "season-one-closer"\n}',
  },
  physical: {
    label: "Physical Drop",
    summary: "Best for merch, event kits or other manually fulfilled rewards that need review and shipping.",
    claimMethod: "manual_fulfillment",
    rarity: "legendary",
    claimable: true,
    type: "Physical",
    recommendedConfig: '{\n  "requiresShippingForm": true,\n  "region": "EU"\n}',
  },
  custom: {
    label: "Custom Reward",
    summary: "Use a flexible reward when the fulfillment flow is still bespoke or experimental.",
    claimMethod: "manual_fulfillment",
    rarity: "common",
    claimable: true,
    type: "Custom",
    recommendedConfig: '{\n  "notes": "Describe how this reward is delivered."\n}',
  },
};

export default function RewardForm({
  projects,
  campaigns,
  initialValues,
  defaultProjectId,
  onSubmit,
  submitLabel = "Save Reward",
}: Props) {
  const [values, setValues] = useState<Omit<AdminReward, "id">>(
    initialValues || {
      projectId: defaultProjectId || projects[0]?.id || "",
      campaignId: "",

      title: "",
      description: "",

      type: "Reward",
      rewardType: "custom",

      rarity: "common",

      cost: 0,
      claimable: false,
      visible: true,

      icon: "",
      imageUrl: "",

      stock: undefined,
      unlimitedStock: true,

      claimMethod: "manual_fulfillment",
      deliveryConfig: "",

      status: "draft",
    }
  );
  const [selectedPreset, setSelectedPreset] = useState<AdminReward["rewardType"]>(
    initialValues?.rewardType || "custom"
  );

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => campaign.projectId === values.projectId);
  }, [campaigns, values.projectId]);
  const selectedProject = projects.find((project) => project.id === values.projectId);
  const activePreset = REWARD_TYPE_PRESETS[selectedPreset];

  useEffect(() => {
    if (!values.projectId && defaultProjectId) {
      setValues((current) => ({ ...current, projectId: defaultProjectId }));
    }
  }, [defaultProjectId, values.projectId]);

  useEffect(() => {
    if (!filteredCampaigns.length && values.campaignId) {
      setValues((current) => ({ ...current, campaignId: "" }));
      return;
    }

    if (
      values.campaignId &&
      !filteredCampaigns.some((campaign) => campaign.id === values.campaignId)
    ) {
      setValues((current) => ({ ...current, campaignId: "" }));
    }
  }, [filteredCampaigns, values.campaignId]);

  function applyPreset(rewardType: AdminReward["rewardType"]) {
    const preset = REWARD_TYPE_PRESETS[rewardType];
    setSelectedPreset(rewardType);
    setValues((current) => ({
      ...current,
      rewardType,
      claimMethod: preset.claimMethod,
      rarity: preset.rarity,
      claimable: preset.claimable,
      type: preset.type,
      deliveryConfig:
        current.deliveryConfig?.trim() && current.rewardType === rewardType
          ? current.deliveryConfig
          : preset.recommendedConfig,
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
          Reward Blueprint
        </p>

        <div className="grid gap-3 xl:grid-cols-2">
          {(
            ["token", "nft", "role", "allowlist", "access", "badge"] as AdminReward["rewardType"][]
          ).map((rewardType) => {
            const preset = REWARD_TYPE_PRESETS[rewardType];
            const isActive = values.rewardType === rewardType;

            return (
              <button
                key={rewardType}
                type="button"
                onClick={() => applyPreset(rewardType)}
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
              <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">{activePreset.claimMethod.replace(/_/g, " ")}</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-text">{activePreset.rarity}</span>
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

          <Field label="Campaign (optional)">
            <select
              value={values.campaignId || ""}
              onChange={(e) =>
                setValues({ ...values, campaignId: e.target.value || "" })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="">No linked campaign</option>
              {filteredCampaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Reward Title">
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
              placeholder="Reward"
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            value={values.description}
            onChange={(e) =>
              setValues({ ...values, description: e.target.value })
            }
            rows={5}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            required
          />
        </Field>

        {selectedProject ? (
          <p className="text-sm text-sub">
            This reward will belong to <span className="font-semibold text-text">{selectedProject.name}</span>
            {values.campaignId
              ? " and is already linked to a campaign."
              : " and can optionally be attached to a campaign for tighter reward loops."}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Reward Settings
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Reward Type">
            <select
              value={values.rewardType}
              onChange={(e) =>
                applyPreset(e.target.value as AdminReward["rewardType"])
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="token">token</option>
              <option value="nft">nft</option>
              <option value="role">role</option>
              <option value="allowlist">allowlist</option>
              <option value="access">access</option>
              <option value="badge">badge</option>
              <option value="physical">physical</option>
              <option value="custom">custom</option>
            </select>
          </Field>

          <Field label="Rarity">
            <select
              value={values.rarity}
              onChange={(e) =>
                setValues({
                  ...values,
                  rarity: e.target.value as AdminReward["rarity"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="common">common</option>
              <option value="rare">rare</option>
              <option value="epic">epic</option>
              <option value="legendary">legendary</option>
            </select>
          </Field>

          <Field label="Cost">
            <input
              type="number"
              min={0}
              value={values.cost}
              onChange={(e) =>
                setValues({ ...values, cost: Number(e.target.value) })
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
                  status: e.target.value as AdminReward["status"],
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

        <div className="grid gap-5 md:grid-cols-3">
          <ToggleField
            label="Claimable"
            checked={values.claimable}
            onChange={(checked) =>
              setValues({ ...values, claimable: checked })
            }
          />

          <ToggleField
            label="Visible"
            checked={values.visible}
            onChange={(checked) =>
              setValues({ ...values, visible: checked })
            }
          />

          <ToggleField
            label="Unlimited Stock"
            checked={values.unlimitedStock}
            onChange={(checked) =>
              setValues({
                ...values,
                unlimitedStock: checked,
                stock: checked ? undefined : values.stock,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Visuals
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Icon URL">
            <input
              value={values.icon || ""}
              onChange={(e) => setValues({ ...values, icon: e.target.value })}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://..."
            />
          </Field>

          <Field label="Image URL">
            <input
              value={values.imageUrl || ""}
              onChange={(e) =>
                setValues({ ...values, imageUrl: e.target.value })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              placeholder="https://..."
            />
          </Field>
        </div>

        <div className="rounded-2xl border border-line bg-card2 p-4 text-sm text-sub">
          <span className="font-semibold text-text">Builder hint:</span> keep the cost and rarity aligned with the effort of the quests that unlock this reward. The stronger the reward, the more important it is to make fulfillment and stock rules explicit.
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Inventory & Fulfillment
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          {!values.unlimitedStock ? (
            <Field label="Stock">
              <input
                type="number"
                min={0}
                value={values.stock ?? ""}
                onChange={(e) =>
                  setValues({
                    ...values,
                    stock: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
              />
            </Field>
          ) : (
            <div />
          )}

          <Field label="Claim Method">
            <select
              value={values.claimMethod}
              onChange={(e) =>
                setValues({
                  ...values,
                  claimMethod: e.target.value as AdminReward["claimMethod"],
                })
              }
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="instant_auto">instant_auto</option>
              <option value="manual_fulfillment">manual_fulfillment</option>
              <option value="wallet_airdrop">wallet_airdrop</option>
              <option value="role_assignment">role_assignment</option>
              <option value="code_distribution">code_distribution</option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Delivery Config (JSON)">
              <textarea
                value={values.deliveryConfig || ""}
                onChange={(e) =>
                  setValues({ ...values, deliveryConfig: e.target.value })
                }
                rows={5}
                className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
                placeholder={activePreset.recommendedConfig}
              />
            </Field>
            <p className="mt-2 text-sm text-sub">
              Start from the recommended config for <span className="font-semibold text-text">{activePreset.label}</span> and adapt the delivery details for this project.
            </p>
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
