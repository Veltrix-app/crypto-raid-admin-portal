import type { AdminRaid } from "@/types/entities/raid";

type RaidLike = Partial<
  Pick<
    AdminRaid,
    | "title"
    | "community"
    | "target"
    | "targetUrl"
    | "instructions"
    | "verificationType"
    | "verificationConfig"
    | "timer"
    | "status"
    | "rewardXp"
    | "shortDescription"
  >
>;

export type RaidStudioReadinessItem = {
  label: string;
  value: string;
  complete: boolean;
};

export type RaidLaunchWarning = {
  label: string;
  description: string;
  tone: "default" | "warning" | "success";
};

export type RaidMemberPreview = {
  title: string;
  eyebrow: string;
  summary: string;
  cta: string;
  verificationLabel: string;
  rewardLabel: string;
  timerLabel: string;
  instructionCount: number;
};

function normalizeInstructions(values: RaidLike) {
  return (values.instructions ?? []).filter((item) => item.trim().length > 0);
}

function hasValidJson(raw: string | undefined) {
  if (!raw?.trim()) {
    return true;
  }

  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}

export function getRaidStudioReadiness(input: {
  values: RaidLike;
  campaignCount: number;
}): RaidStudioReadinessItem[] {
  const instructions = normalizeInstructions(input.values);

  return [
    {
      label: "Destination",
      value: input.values.targetUrl?.trim()
        ? "Target URL connected"
        : "Missing destination URL",
      complete: Boolean(input.values.targetUrl?.trim()),
    },
    {
      label: "Instructions",
      value: instructions.length
        ? `${instructions.length} launch steps set`
        : "No contributor steps yet",
      complete: instructions.length > 0,
    },
    {
      label: "Campaign context",
      value:
        input.campaignCount > 0
          ? `${input.campaignCount} campaign lane${input.campaignCount === 1 ? "" : "s"} available`
          : "No campaign lane available",
      complete: input.campaignCount > 0,
    },
    {
      label: "Verification",
      value: input.values.verificationType?.replace(/_/g, " ") || "Manual confirm",
      complete: hasValidJson(input.values.verificationConfig),
    },
  ];
}

export function getRaidMemberPreview(values: RaidLike): RaidMemberPreview {
  const instructions = normalizeInstructions(values);

  return {
    title: values.title?.trim() || "Untitled raid",
    eyebrow: values.community?.trim() || "Pressure lane",
    summary:
      values.shortDescription?.trim() ||
      "A live pressure mission aimed at one clear destination and one clear reaction.",
    cta: values.target?.trim() || "Set the pressure objective",
    verificationLabel:
      values.verificationType?.replace(/_/g, " ") || "manual confirm",
    rewardLabel: `${values.rewardXp ?? 0} XP`,
    timerLabel: values.timer?.trim() || "No timer set",
    instructionCount: instructions.length,
  };
}

export function getRaidLaunchWarnings(input: {
  values: RaidLike;
}): RaidLaunchWarning[] {
  const warnings: RaidLaunchWarning[] = [];
  const instructions = normalizeInstructions(input.values);

  if (!hasValidJson(input.values.verificationConfig)) {
    warnings.push({
      label: "Verification config",
      description: "The verification JSON is invalid and needs to be fixed before this raid can launch cleanly.",
      tone: "warning",
    });
  }

  if (!input.values.timer?.trim() && input.values.status === "active") {
    warnings.push({
      label: "Timer posture",
      description: "This raid is marked active without a visible timer or urgency cue.",
      tone: "warning",
    });
  }

  if (!input.values.targetUrl?.trim()) {
    warnings.push({
      label: "Destination",
      description: "Connect the exact destination URL so the pressure wave points somewhere real.",
      tone: "warning",
    });
  }

  if (!instructions.length) {
    warnings.push({
      label: "Contributor steps",
      description: "Add at least one contributor instruction so the raid lands as a guided mission instead of a vague alert.",
      tone: "warning",
    });
  }

  if (!warnings.length) {
    warnings.push({
      label: "Launch posture",
      description: "The current raid setup looks stable enough for the next studio step.",
      tone: "success",
    });
  }

  return warnings;
}
