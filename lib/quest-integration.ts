type QuestIntegrationShape = {
  quest_type?: string | null;
  verification_type?: string | null;
  verification_provider?: string | null;
  completion_mode?: string | null;
  verification_config?: Record<string, unknown> | null;
};

function isPlaceholderUrl(value: string) {
  return value.includes("...");
}

export function resolveQuestIntegration(shape: QuestIntegrationShape) {
  const questType = shape.quest_type ?? "custom";
  const verificationType = shape.verification_type ?? "manual_review";
  const verificationConfig =
    shape.verification_config && typeof shape.verification_config === "object"
      ? shape.verification_config
      : {};

  const normalizedVerificationProvider =
    shape.verification_provider && shape.verification_provider !== "custom"
      ? shape.verification_provider
      : null;

  const inferredVerificationProvider =
    (questType === "telegram_join"
      ? "telegram"
      : questType === "discord_join"
        ? "discord"
        : questType === "social_follow"
          ? "x"
          : questType === "url_visit"
            ? "website"
            : verificationType === "bot_check" &&
                typeof verificationConfig.groupUrl === "string" &&
                verificationConfig.groupUrl.trim().length > 0
              ? "telegram"
              : verificationType === "bot_check" &&
                  typeof verificationConfig.inviteUrl === "string" &&
                  verificationConfig.inviteUrl.trim().length > 0
                ? "discord"
                : verificationType === "api_check" &&
                    (typeof verificationConfig.profileUrl === "string" ||
                      typeof verificationConfig.handle === "string")
                    ? "x"
                  : verificationType === "event_check" &&
                      typeof verificationConfig.targetUrl === "string"
                    ? "website"
                    : null);

  const verificationProvider =
    normalizedVerificationProvider ?? inferredVerificationProvider;

  const shouldForceIntegrationAuto =
    (questType === "telegram_join" &&
      verificationType === "bot_check" &&
      (typeof verificationConfig.groupUrl !== "string" ||
        !isPlaceholderUrl(verificationConfig.groupUrl))) ||
    (questType === "discord_join" &&
      verificationType === "bot_check" &&
      (typeof verificationConfig.inviteUrl !== "string" ||
        !isPlaceholderUrl(verificationConfig.inviteUrl))) ||
    (questType === "social_follow" && verificationType === "api_check") ||
    (questType === "url_visit" && verificationType === "event_check");

  const completionMode =
    shouldForceIntegrationAuto
      ? "integration_auto"
      : shape.completion_mode ??
        (verificationProvider &&
        ["bot_check", "api_check", "event_check"].includes(verificationType)
          ? "integration_auto"
          : verificationType === "manual_review"
            ? "manual"
            : verificationType === "hybrid"
              ? "hybrid"
              : "rule_auto");

  return {
    questType,
    verificationType,
    verificationProvider,
    completionMode,
    verificationConfig,
  };
}
