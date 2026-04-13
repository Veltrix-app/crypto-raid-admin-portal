export type AdminQuest = {
  id: string;

  projectId: string;
  campaignId: string;

  title: string;
  description: string;
  shortDescription?: string;

  type: string;

  questType:
    | "social_follow"
    | "social_like"
    | "social_repost"
    | "social_comment"
    | "telegram_join"
    | "discord_join"
    | "wallet_connect"
    | "token_hold"
    | "nft_hold"
    | "onchain_tx"
    | "url_visit"
    | "referral"
    | "manual_proof"
    | "custom";

  platform?: "x" | "telegram" | "discord" | "wallet" | "website" | "custom";

  xp: number;
  actionLabel: string;
  actionUrl?: string;

  proofRequired: boolean;
  proofType: "none" | "text" | "url" | "image" | "wallet" | "tx_hash";

  autoApprove: boolean;
  verificationType:
    | "api_check"
    | "bot_check"
    | "onchain_check"
    | "event_check"
    | "manual_review"
    | "hybrid";
  verificationProvider?: "website" | "x" | "discord" | "telegram" | "wallet" | "custom";
  completionMode?: "manual" | "rule_auto" | "integration_auto" | "hybrid";

  verificationConfig?: string;

  isRepeatable: boolean;
  cooldownSeconds?: number;
  maxCompletionsPerUser?: number;
  sortOrder: number;

  startsAt?: string;
  endsAt?: string;

  status: "draft" | "active" | "paused" | "archived";
};
