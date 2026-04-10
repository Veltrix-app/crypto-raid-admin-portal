"use client";

import { useMemo, useState } from "react";
import { AdminReward } from "@/types/entities/reward";
import { AdminProject } from "@/types/entities/project";
import { AdminCampaign } from "@/types/entities/campaign";

type Props = {
  projects: AdminProject[];
  campaigns: AdminCampaign[];
  initialValues?: Omit<AdminReward, "id">;
  onSubmit: (values: Omit<AdminReward, "id">) => void | Promise<void>;
  submitLabel?: string;
};

export default function RewardForm({
  projects,
  campaigns,
  initialValues,
  onSubmit,
  submitLabel = "Save Reward",
}: Props) {
  const [values, setValues] = useState<Omit<AdminReward, "id">>(
    initialValues || {
      projectId: projects[0]?.id || "",
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
                setValues({
                  ...values,
                  rewardType: e.target.value as AdminReward["rewardType"],
                })
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
                placeholder='{"key":"value"}'
              />
            </Field>
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