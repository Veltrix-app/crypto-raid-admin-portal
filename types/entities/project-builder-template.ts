export type AdminProjectBuilderTemplateKind =
  | "campaign"
  | "quest"
  | "raid"
  | "playbook";

export type AdminProjectBuilderTemplate = {
  id: string;
  projectId: string;
  templateKind: AdminProjectBuilderTemplateKind;
  name: string;
  description?: string;
  baseTemplateId?: string;
  configuration: string;
  legacyCampaignTemplateId?: string;
  createdAt?: string;
  updatedAt?: string;
};
