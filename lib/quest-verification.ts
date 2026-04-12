import { AdminQuest } from "@/types/entities/quest";

type VerificationPreviewParams = Pick<
  AdminQuest,
  "questType" | "verificationType" | "proofRequired" | "proofType" | "autoApprove" | "verificationConfig"
>;

export type QuestVerificationPreview = {
  routeLabel: string;
  routeDescription: string;
  proofExpectation: string;
  requiredConfigKeys: string[];
  missingConfigKeys: string[];
  invalidConfig: boolean;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseVerificationConfig(value?: string) {
  if (!value?.trim()) {
    return { config: {} as Record<string, unknown>, invalid: false };
  }

  try {
    const parsed = JSON.parse(value);
    return {
      config:
        parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : {},
      invalid: false,
    };
  } catch {
    return { config: {} as Record<string, unknown>, invalid: true };
  }
}

export function getRequiredVerificationKeys(questType: AdminQuest["questType"]) {
  switch (questType) {
    case "social_follow":
      return ["handle"];
    case "social_like":
    case "social_repost":
    case "social_comment":
      return ["postUrl"];
    case "telegram_join":
      return ["groupUrl"];
    case "discord_join":
      return ["inviteUrl"];
    case "token_hold":
      return ["contractAddress", "minimumBalance"];
    case "nft_hold":
      return ["contractAddress", "minimumOwned"];
    case "onchain_tx":
      return ["contractAddress", "method"];
    case "url_visit":
      return ["targetUrl"];
    case "referral":
      return ["minimumReferrals"];
    case "manual_proof":
      return ["instructions"];
    default:
      return [];
  }
}

export function getQuestVerificationPreview(
  params: VerificationPreviewParams
): QuestVerificationPreview {
  const requiredConfigKeys = getRequiredVerificationKeys(params.questType);
  const { config, invalid } = parseVerificationConfig(params.verificationConfig);
  const missingConfigKeys = requiredConfigKeys.filter((key) => {
    const value = config[key];

    if (typeof value === "number") {
      return Number.isNaN(value);
    }

    if (typeof value === "boolean") {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return !isNonEmptyString(value);
  });

  const proofExpectation = !params.proofRequired || params.proofType === "none"
    ? "Contributors should be able to complete this without uploading proof."
    : `Contributors must submit ${params.proofType.replace(/_/g, " ")} proof.`;

  if (invalid) {
    return {
      routeLabel: "Config invalid",
      routeDescription:
        "The verification config is not valid JSON yet, so this quest cannot follow a predictable automation path.",
      proofExpectation,
      requiredConfigKeys,
      missingConfigKeys: requiredConfigKeys,
      invalidConfig: true,
    };
  }

  if (missingConfigKeys.length > 0) {
    return {
      routeLabel: "Needs config review",
      routeDescription:
        "The quest rules are missing required config keys, so submissions will be routed to review instead of confidently auto-verifying.",
      proofExpectation,
      requiredConfigKeys,
      missingConfigKeys,
      invalidConfig: false,
    };
  }

  if (params.questType === "manual_proof") {
    return {
      routeLabel: "Manual review",
      routeDescription:
        "Manual proof quests are intentionally reviewer-led. Clear instructions matter more here than automation.",
      proofExpectation,
      requiredConfigKeys,
      missingConfigKeys,
      invalidConfig: false,
    };
  }

  if (params.questType === "referral" || params.verificationType === "hybrid") {
    return {
      routeLabel: "Hybrid review",
      routeDescription:
        "This quest mixes automation with reviewer checks. Veltrix can pre-screen it, but final approval may still require moderation or downstream validation.",
      proofExpectation,
      requiredConfigKeys,
      missingConfigKeys,
      invalidConfig: false,
    };
  }

  if (
    params.autoApprove ||
    params.verificationType === "api_check" ||
    params.verificationType === "bot_check" ||
    params.verificationType === "event_check" ||
    params.verificationType === "onchain_check"
  ) {
    return {
      routeLabel: "Rule auto-approve",
      routeDescription:
        "Low-risk submissions that match these quest rules can be auto-approved without sending owners into the moderation queue.",
      proofExpectation,
      requiredConfigKeys,
      missingConfigKeys,
      invalidConfig: false,
    };
  }

  return {
    routeLabel: "Manual review",
    routeDescription:
      "This configuration currently defaults to manual review. Tighten the verification type or rules if you want lower-touch moderation.",
    proofExpectation,
    requiredConfigKeys,
    missingConfigKeys,
    invalidConfig: false,
  };
}
