import type {
  AdminCommercialFollowUpTaskDueState,
  AdminCommercialLeadState,
  AdminCommercialLeadSource,
  AdminCommercialLeadNoteType,
  AdminCommercialFollowUpTaskType,
} from "@/types/entities/growth-sales";

export const commercialLeadStateOptions: Array<{
  value: AdminCommercialLeadState;
  label: string;
}> = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "watching", label: "Watching" },
  { value: "engaged", label: "Engaged" },
  { value: "evaluation", label: "Evaluation" },
  { value: "converted", label: "Converted" },
  { value: "cooling_off", label: "Cooling off" },
  { value: "lost", label: "Lost" },
];

export const commercialNoteTypeOptions: Array<{
  value: AdminCommercialLeadNoteType;
  label: string;
}> = [
  { value: "general", label: "General" },
  { value: "qualification", label: "Qualification" },
  { value: "buyer_concern", label: "Buyer concern" },
  { value: "enterprise_requirement", label: "Enterprise requirement" },
  { value: "follow_up", label: "Follow-up" },
];

export const commercialTaskTypeOptions: Array<{
  value: AdminCommercialFollowUpTaskType;
  label: string;
}> = [
  { value: "follow_up", label: "Follow-up" },
  { value: "qualification", label: "Qualification" },
  { value: "demo_follow_up", label: "Demo follow-up" },
  { value: "enterprise_review", label: "Enterprise review" },
  { value: "expansion_follow_up", label: "Expansion follow-up" },
];

export function humanizeCommercialLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function leadStateTone(value: AdminCommercialLeadState) {
  switch (value) {
    case "engaged":
    case "evaluation":
      return "warning" as const;
    case "converted":
      return "success" as const;
    case "cooling_off":
    case "lost":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

export function sourceTone(value: AdminCommercialLeadSource) {
  switch (value) {
    case "pricing":
    case "trust":
    case "docs":
      return "warning" as const;
    case "enterprise_intake":
    case "demo_request":
      return "success" as const;
    default:
      return "default" as const;
  }
}

export function deriveCommercialTaskDueState(
  status: string,
  dueAt: string | null | undefined
): AdminCommercialFollowUpTaskDueState {
  if (status === "resolved" || status === "canceled") {
    return "resolved";
  }

  if (!dueAt) {
    return "upcoming";
  }

  const dueDate = new Date(dueAt);
  if (Number.isNaN(dueDate.getTime())) {
    return "upcoming";
  }

  const now = new Date();
  const difference = dueDate.getTime() - now.getTime();

  if (difference < 0) {
    return "overdue";
  }

  if (difference <= 1000 * 60 * 60 * 24) {
    return "due_now";
  }

  return "upcoming";
}
