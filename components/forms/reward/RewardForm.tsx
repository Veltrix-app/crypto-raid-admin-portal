"use client";

import { useState } from "react";
import { AdminReward } from "@/types/entities/reward";

type Props = {
  initialValues?: Omit<AdminReward, "id">;
  onSubmit: (values: Omit<AdminReward, "id">) => void;
  submitLabel?: string;
};

export default function RewardForm({
  initialValues,
  onSubmit,
  submitLabel = "Save Reward",
}: Props) {
  const [values, setValues] = useState<Omit<AdminReward, "id">>(
    initialValues || {
      title: "",
      type: "access",
      rarity: "common",
      cost: 250,
      stock: 100,
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
        <Field label="Reward Title">
          <input
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            required
          />
        </Field>

        <Field label="Type">
          <select
            value={values.type}
            onChange={(e) =>
              setValues({
                ...values,
                type: e.target.value as AdminReward["type"],
              })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          >
            <option value="access">access</option>
            <option value="token">token</option>
            <option value="badge">badge</option>
            <option value="role">role</option>
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

        <Field label="XP Cost">
          <input
            type="number"
            value={values.cost}
            onChange={(e) =>
              setValues({ ...values, cost: Number(e.target.value) })
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
          />
        </Field>

        <Field label="Stock">
          <input
            type="number"
            value={values.stock}
            onChange={(e) =>
              setValues({ ...values, stock: Number(e.target.value) })
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