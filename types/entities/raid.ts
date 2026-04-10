export type AdminRaid = {
  id: string;

  projectId: string;
  campaignId: string;

  title: string;
  shortDescription?: string;
  community: string;
  target: string;

  banner?: string;

  rewardXp: number;
  participants: number;
  progress: number;
  timer?: string;

  platform: "x" | "telegram" | "discord" | "website" | "reddit" | "custom";

  targetUrl?: string;
  targetPostId?: string;
  targetAccountHandle?: string;

  verificationType:
    | "manual_confirm"
    | "api_follow_check"
    | "api_like_check"
    | "api_repost_check"
    | "telegram_bot_check"
    | "discord_role_check"
    | "url_click";

  verificationConfig?: string;

  instructions: string[];

  startsAt?: string;
  endsAt?: string;

  status: "draft" | "scheduled" | "active" | "paused" | "ended";
};