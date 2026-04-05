"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function SettingsBillingPage() {
  const billingPlans = useAdminPortalStore((s) => s.billingPlans);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Subscription & Billing
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Billing</h1>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {billingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-[28px] border bg-card p-6 ${
                plan.current ? "border-primary/30 shadow-neon" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold text-text">{plan.name}</h2>
                {plan.current ? (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-black">
                    Current
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-4xl font-extrabold text-text">
                €{plan.priceMonthly}
                <span className="text-base font-medium text-sub">/mo</span>
              </p>

              <div className="mt-5 space-y-2 text-sm text-sub">
                <p>Projects: {plan.projectsLimit === 999 ? "Unlimited" : plan.projectsLimit}</p>
                <p>Campaigns: {plan.campaignsLimit === 999 ? "Unlimited" : plan.campaignsLimit}</p>
              </div>

              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl border border-line bg-card2 px-3 py-3 text-sm text-text"
                  >
                    {feature}
                  </div>
                ))}
              </div>

              <button
                className={`mt-6 w-full rounded-2xl px-4 py-3 font-bold ${
                  plan.current
                    ? "border border-line bg-card2 text-text"
                    : "bg-primary text-black"
                }`}
              >
                {plan.current ? "Current Plan" : "Choose Plan"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}