import { CampaignTemplateId } from "@/lib/campaign-templates";

export type AdminProjectCampaignTemplate = {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  baseTemplateId: CampaignTemplateId;
  configuration: string;
  createdAt?: string;
  updatedAt?: string;
};
