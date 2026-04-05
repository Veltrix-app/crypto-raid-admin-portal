export type AdminBillingPlan = {
  id: string;
  name: string;
  priceMonthly: number;
  projectsLimit: number;
  campaignsLimit: number;
  features: string[];
  current?: boolean;
};