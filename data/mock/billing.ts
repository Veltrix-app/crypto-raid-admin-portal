import { AdminBillingPlan } from "@/types/entities/billing-plan";

export const mockBillingPlans: AdminBillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 99,
    projectsLimit: 1,
    campaignsLimit: 5,
    features: [
      "1 project workspace",
      "5 active campaigns",
      "Basic moderation",
      "Basic analytics",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 299,
    projectsLimit: 5,
    campaignsLimit: 25,
    features: [
      "Up to 5 projects",
      "25 active campaigns",
      "Advanced moderation",
      "Advanced analytics",
      "Team roles",
    ],
    current: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 999,
    projectsLimit: 999,
    campaignsLimit: 999,
    features: [
      "Unlimited projects",
      "Unlimited campaigns",
      "Custom roles",
      "Priority support",
      "White-label options",
    ],
  },
];