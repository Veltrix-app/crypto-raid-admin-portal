"use client";

import type { Dispatch, SetStateAction } from "react";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import {
  CommunityPushSettings,
  PushDeliveryMode,
  PushScopeMode,
  describeIntegrationStatus,
  getIntegrationTone,
  toggleScopeSelection,
} from "@/components/community/community-config";

type ProjectOption = {
  id: string;
  name: string;
};

type CampaignOption = {
  id: string;
  title: string;
  projectId: string;
};

type DiscordIntegrationConfig = {
  guildId: string;
  serverId: string;
};

type TelegramIntegrationConfig = {
  chatId: string;
  groupId: string;
};

type Props = {
  projectName: string;
  xIntegrationStatus: string;
  discordIntegrationStatus: string;
  telegramIntegrationStatus: string;
  discordIntegrationConfig: DiscordIntegrationConfig;
  setDiscordIntegrationConfig: Dispatch<SetStateAction<DiscordIntegrationConfig>>;
  telegramIntegrationConfig: TelegramIntegrationConfig;
  setTelegramIntegrationConfig: Dispatch<SetStateAction<TelegramIntegrationConfig>>;
  discordPushSettings: CommunityPushSettings;
  setDiscordPushSettings: Dispatch<SetStateAction<CommunityPushSettings>>;
  telegramPushSettings: CommunityPushSettings;
  setTelegramPushSettings: Dispatch<SetStateAction<CommunityPushSettings>>;
  selectableProjects: ProjectOption[];
  campaigns: CampaignOption[];
  projectNameById: Map<string, string>;
  savingIntegration: "discord" | "telegram" | null;
  testingIntegration: "discord" | "telegram" | null;
  integrationNotice: string;
  integrationTestNotice: string;
  integrationTestTone: "success" | "error";
  onSaveIntegration: (provider: "discord" | "telegram") => void;
  onSendTestPush: (provider: "discord" | "telegram") => void;
};

function ProviderPushSettings({
  provider,
  settings,
  setSettings,
  selectableProjects,
  campaigns,
  projectNameById,
}: {
  provider: "discord" | "telegram";
  settings: CommunityPushSettings;
  setSettings: Dispatch<SetStateAction<CommunityPushSettings>>;
  selectableProjects: ProjectOption[];
  campaigns: CampaignOption[];
  projectNameById: Map<string, string>;
}) {
  const channelPlaceholder =
    provider === "discord" ? "Target Discord channel ID" : "Target Telegram chat ID for pushes";

  return (
    <div className="rounded-[24px] border border-line bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
        Community Push Settings
      </p>
      <div className="mt-4 grid gap-3">
        <label className="space-y-2 text-sm text-sub">
          <span className="font-semibold text-text">Push scope</span>
          <select
            value={settings.scopeMode}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                scopeMode: event.target.value as PushScopeMode,
              }))
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
          >
            <option value="project_only">Only this project</option>
            <option value="selected_projects">Selected projects</option>
            <option value="selected_campaigns">Selected campaigns</option>
            <option value="all_public">Everything public</option>
          </select>
        </label>

        {settings.scopeMode === "selected_projects" ? (
          <div className="space-y-2 rounded-2xl border border-line bg-card2 p-4">
            <p className="text-sm font-semibold text-text">Allowed projects</p>
            <div className="grid gap-2">
              {selectableProjects.length > 0 ? (
                selectableProjects.map((candidate) => (
                  <label
                    key={candidate.id}
                    className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text"
                  >
                    <span>{candidate.name}</span>
                    <input
                      type="checkbox"
                      checked={settings.selectedProjectIds.includes(candidate.id)}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          selectedProjectIds: toggleScopeSelection(
                            current.selectedProjectIds,
                            candidate.id,
                            event.target.checked
                          ),
                        }))
                      }
                    />
                  </label>
                ))
              ) : (
                <p className="text-sm text-sub">No other visible projects are available here.</p>
              )}
            </div>
          </div>
        ) : null}

        {settings.scopeMode === "selected_campaigns" ? (
          <div className="space-y-2 rounded-2xl border border-line bg-card2 p-4">
            <p className="text-sm font-semibold text-text">Allowed campaigns</p>
            <div className="grid gap-2">
              {campaigns.length > 0 ? (
                campaigns.map((candidate) => (
                  <label
                    key={candidate.id}
                    className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text"
                  >
                    <span>
                      {candidate.title}
                      <span className="ml-2 text-sub">
                        {projectNameById.get(candidate.projectId) || "Unknown project"}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.selectedCampaignIds.includes(candidate.id)}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          selectedCampaignIds: toggleScopeSelection(
                            current.selectedCampaignIds,
                            candidate.id,
                            event.target.checked
                          ),
                        }))
                      }
                    />
                  </label>
                ))
              ) : (
                <p className="text-sm text-sub">No campaigns are available yet.</p>
              )}
            </div>
          </div>
        ) : null}

        <label className="space-y-2 text-sm text-sub">
          <span className="font-semibold text-text">Delivery mode</span>
          <select
            value={settings.deliveryMode}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                deliveryMode: event.target.value as PushDeliveryMode,
              }))
            }
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
          >
            <option value="broadcast">Broadcast everything that matches</option>
            <option value="priority_only">High-priority only</option>
          </select>
        </label>

        <input
          value={provider === "discord" ? settings.targetChannelId : settings.targetChatId}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              ...(provider === "discord"
                ? { targetChannelId: event.target.value }
                : { targetChatId: event.target.value }),
            }))
          }
          placeholder={channelPlaceholder}
          className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
        />

        {provider === "discord" ? (
          <input
            value={settings.targetThreadId}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                targetThreadId: event.target.value,
              }))
            }
            placeholder="Optional Discord thread ID"
            className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["allowCampaigns", "Campaigns"],
            ["allowQuests", "Quests"],
            ["allowRaids", "Raids"],
            ["allowRewards", "Rewards"],
            ["allowAnnouncements", "Announcements"],
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text"
            >
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(settings[key as keyof CommunityPushSettings])}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    [key]: event.target.checked,
                  }))
                }
              />
            </label>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text">
            <span>Featured only</span>
            <input
              type="checkbox"
              checked={settings.featuredOnly}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  featuredOnly: event.target.checked,
                }))
              }
            />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text">
            <span>Live only</span>
            <input
              type="checkbox"
              checked={settings.liveOnly}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  liveOnly: event.target.checked,
                }))
              }
            />
          </label>
        </div>

        <input
          value={settings.minXp}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              minXp: event.target.value,
            }))
          }
          placeholder="Minimum XP threshold (optional)"
          className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
        />
      </div>
    </div>
  );
}

export function CommunityIntegrationsPanel({
  projectName,
  xIntegrationStatus,
  discordIntegrationStatus,
  telegramIntegrationStatus,
  discordIntegrationConfig,
  setDiscordIntegrationConfig,
  telegramIntegrationConfig,
  setTelegramIntegrationConfig,
  discordPushSettings,
  setDiscordPushSettings,
  telegramPushSettings,
  setTelegramPushSettings,
  selectableProjects,
  campaigns,
  projectNameById,
  savingIntegration,
  testingIntegration,
  integrationNotice,
  integrationTestNotice,
  integrationTestTone,
  onSaveIntegration,
  onSendTestPush,
}: Props) {
  return (
    <OpsPanel
      eyebrow="Integrations"
      title="Channels, verification rails and push targets"
      description="Keep provider verification healthy, save the delivery rails for this project and send live test pushes without publishing a quest or raid first."
    >
      <div className="space-y-6">
        <div className="rounded-[24px] border border-line bg-card2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">X follow verification</p>
              <p className="mt-2 text-sm text-sub">
                X stays API-driven. This page shows whether the follow rail for {projectName} is ready.
              </p>
            </div>
            <OpsStatusPill tone={getIntegrationTone(xIntegrationStatus)}>
              {describeIntegrationStatus("X", xIntegrationStatus)}
            </OpsStatusPill>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Discord community rail</p>
                <p className="mt-2 text-sm text-sub">
                  Save the Discord guild and channel setup that the community bot should verify and post into.
                </p>
              </div>
              <OpsStatusPill tone={getIntegrationTone(discordIntegrationStatus)}>
                {discordIntegrationStatus}
              </OpsStatusPill>
            </div>

            <div className="mt-4 grid gap-3">
              <input
                value={discordIntegrationConfig.guildId}
                onChange={(event) =>
                  setDiscordIntegrationConfig((current) => ({
                    ...current,
                    guildId: event.target.value,
                  }))
                }
                placeholder="Discord guild ID"
                className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
              />
              <input
                value={discordIntegrationConfig.serverId}
                onChange={(event) =>
                  setDiscordIntegrationConfig((current) => ({
                    ...current,
                    serverId: event.target.value,
                  }))
                }
                placeholder="Optional legacy server ID"
                className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
              />

              <ProviderPushSettings
                provider="discord"
                settings={discordPushSettings}
                setSettings={setDiscordPushSettings}
                selectableProjects={selectableProjects}
                campaigns={campaigns}
                projectNameById={projectNameById}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => onSaveIntegration("discord")}
                  disabled={savingIntegration === "discord"}
                  className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingIntegration === "discord" ? "Saving Discord config..." : "Save Discord integration"}
                </button>
                <button
                  onClick={() => onSendTestPush("discord")}
                  disabled={testingIntegration === "discord"}
                  className="rounded-2xl border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {testingIntegration === "discord" ? "Sending Discord test..." : "Send Discord test push"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Telegram community rail</p>
                <p className="mt-2 text-sm text-sub">
                  Save the chat ID that should receive mission, raid and announcement pushes for {projectName}.
                </p>
              </div>
              <OpsStatusPill tone={getIntegrationTone(telegramIntegrationStatus)}>
                {telegramIntegrationStatus}
              </OpsStatusPill>
            </div>

            <div className="mt-4 grid gap-3">
              <input
                value={telegramIntegrationConfig.chatId}
                onChange={(event) =>
                  setTelegramIntegrationConfig((current) => ({
                    ...current,
                    chatId: event.target.value,
                  }))
                }
                placeholder="Telegram chat ID"
                className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
              />
              <input
                value={telegramIntegrationConfig.groupId}
                onChange={(event) =>
                  setTelegramIntegrationConfig((current) => ({
                    ...current,
                    groupId: event.target.value,
                  }))
                }
                placeholder="Optional legacy group ID"
                className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
              />

              <ProviderPushSettings
                provider="telegram"
                settings={telegramPushSettings}
                setSettings={setTelegramPushSettings}
                selectableProjects={selectableProjects}
                campaigns={campaigns}
                projectNameById={projectNameById}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => onSaveIntegration("telegram")}
                  disabled={savingIntegration === "telegram"}
                  className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingIntegration === "telegram"
                    ? "Saving Telegram config..."
                    : "Save Telegram integration"}
                </button>
                <button
                  onClick={() => onSendTestPush("telegram")}
                  disabled={testingIntegration === "telegram"}
                  className="rounded-2xl border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {testingIntegration === "telegram"
                    ? "Sending Telegram test..."
                    : "Send Telegram test push"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {integrationNotice ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            {integrationNotice}
          </div>
        ) : null}

        {integrationTestNotice ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              integrationTestTone === "error"
                ? "border border-rose-500/25 bg-rose-500/10 text-rose-200"
                : "border border-primary/20 bg-primary/10 text-primary"
            }`}
          >
            {integrationTestNotice}
          </div>
        ) : null}
      </div>
    </OpsPanel>
  );
}
