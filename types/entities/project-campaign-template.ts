import { CampaignTemplateId } from "@/lib/campaign-templates";
import { AdminProjectBuilderTemplate } from "@/types/entities/project-builder-template";

export type AdminProjectCampaignTemplate = Omit<
  AdminProjectBuilderTemplate,
  "templateKind" | "baseTemplateId"
> & {
  templateKind?: "campaign";
  baseTemplateId: CampaignTemplateId;
};
