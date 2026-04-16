type QuestIntegrationShape = {
  quest_type?: string | null;
  verification_type?: string | null;
  verification_provider?: string | null;
  completion_mode?: string | null;
  verification_config?: Record<string, unknown> | null;
};

export function resolveQuestIntegration(shape: QuestIntegrationShape) {
  const questType = shape.quest_type ?? "custom";
  const verificationType = shape.verification_type ?? "manual_review";
  const verificationConfig =
    shape.verification_config && typeof shape.verification_config === "object"
      ? shape.verification_config
      : {};

  const verificationProvider =
    shape.verification_provider ??
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

  const completionMode =
    shape.completion_mode ??
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
