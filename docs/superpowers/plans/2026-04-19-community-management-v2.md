# Community Management V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Community OS into a daily-use project-private control room with missions, raid operations, automations, Telegram commands, and contributor readiness.

**Architecture:** Keep `/projects/[id]/community` as the project-scoped control surface, extend `community_bot_settings` through its existing `metadata` contract for v2 controls, add new project-scoped portal actions for mission and raid operations, and extend `veltrix-community-bot` so Discord and Telegram both expose community-facing command rails. Reuse existing reputation, linked-account, wallet, quest, raid, and push systems instead of introducing parallel community data stores.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase service-role APIs, Express, Discord.js, Telegraf, existing Veltrix community push/runtime jobs.

---

## File Structure

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityMembersPanel.tsx`
  - project-scoped contributor readiness, linked identity, and top contributor surface
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityMissionsPanel.tsx`
  - featured/live mission controls, digest state, and manual mission post actions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityRaidOpsPanel.tsx`
  - live raid list, raid alert/reminder controls, and recent raid pressure state
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityAutomationsPanel.tsx`
  - cadence toggles, raid/mission automation state, and manual trigger rail
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-members\route.ts`
  - project-private contributor readiness API
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-mission-post\route.ts`
  - manual mission/community digest trigger
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-raid-post\route.ts`
  - manual raid alert/reminder trigger
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-automation-run\route.ts`
  - proxy route to the runtime automation job

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
  - compose the v2 panels and load the new project-scoped data/actions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\community-config.ts`
  - extend the shared settings contract with automation, missions, raids, and Telegram command state
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverviewPanel.tsx`
  - surface v2 counts and automation status
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCommandsPanel.tsx`
  - show Discord plus Telegram command rails
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-bot-settings\route.ts`
  - read/write the v2 metadata contract

### New runtime files

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\community.ts`
  - Telegram integration context, identity snapshot, mission and leaderboard helpers
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\run-community-automation.ts`
  - project-scoped mission digest and raid automation worker

### Modified runtime files

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\bot.ts`
  - register and launch Telegram command handlers
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\index.ts`
  - launch the Telegram bot command rail cleanly
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts`
  - expose automation, mission, and raid job endpoints
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\commands.ts`
  - add `/raid` to the Discord command rail
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\community.ts`
  - add project-scoped contributor and raid/missions helpers reused by jobs/commands

### No new SQL required

- Persist v2 controls in `community_bot_settings.metadata`.
- Keep existing tables as the source of truth for contributors, missions, raids, reputations, and linked accounts.

---

## Task 1: Extend the Community OS settings contract for v2

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\community-config.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-bot-settings\route.ts`
- Test: `npm run build`

- [ ] Add `telegramCommandsEnabled`, `missionDigestEnabled`, `missionDigestCadence`, `missionDigestTarget`, `raidAlertsEnabled`, `raidRemindersEnabled`, `raidResultsEnabled`, `raidCadence`, `lastMissionDigestAt`, `lastRaidAlertAt`, and `lastAutomationRunAt` to the shared settings type.
- [ ] Read and write those values through `community_bot_settings.metadata` while preserving the existing v1 fields.
- [ ] Keep defaults safe: all v2 automations start off, commands stay opt-in, and timestamps default to empty strings.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 2: Add project-scoped contributor readiness and v2 community panels

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityMembersPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityMissionsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityRaidOpsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityAutomationsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverviewPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCommandsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Test: `npm run build`

- [ ] Build a contributor-readiness panel that shows linked contributors, wallet-verified contributors, top contributors, readiness percentages, and the most link-starved members for the current project only.
- [ ] Build a missions panel that surfaces live campaigns/quests/rewards and offers manual project-scoped mission push actions.
- [ ] Build a raid ops panel that surfaces live raids, readiness state, and manual raid alert/reminder actions.
- [ ] Build an automations panel that shows cadence, what is enabled, and manual run buttons for mission digests and raid ops.
- [ ] Extend the page composition so v2 feels like one control room rather than separate setup cards.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 3: Add project-scoped community APIs for v2 reads and manual actions

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-members\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-mission-post\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-raid-post\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-automation-run\route.ts`
- Reuse: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\community-push\dispatch\route.ts`
- Test: `npm run build`

- [ ] Add a service-role route that returns contributor readiness using `user_connected_accounts`, `wallet_links`, `user_project_reputation`, and project-scoped quest/raid counts.
- [ ] Add mission and raid post routes that only allow content owned by the current project and dispatch through the existing community push layer or runtime jobs.
- [ ] Add an automation proxy route that calls the runtime job with the current `projectId`.
- [ ] Keep all routes hard-filtered by `project_id`.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 4: Add Telegram commands and v2 automation jobs in the runtime

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\community.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\run-community-automation.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\bot.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\commands.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\community.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\index.ts`
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Build Telegram project context loaders so the bot can map a chat to a project, linked identity, leaderboard, missions, and raid state.
- [ ] Register Telegram commands `/link`, `/profile`, `/missions`, `/leaderboard`, and `/raid`.
- [ ] Actually launch the Telegram bot command rail from `index.ts` instead of only probing `getMe()`.
- [ ] Add a project-scoped automation job that posts mission digests and raid alerts based on `community_bot_settings.metadata`.
- [ ] Add a Discord `/raid` command that shows the live raid rail for the project community.
- [ ] Run `npm run typecheck --workspace veltrix-community-bot` and `npm run build --workspace veltrix-community-bot`.

## Task 5: Wire v2 portal actions to the runtime and refresh overview/activity state

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverviewPanel.tsx`
- Reuse: job routes and new project APIs
- Test: `npm run build`

- [ ] After manual mission, raid, and automation runs, update notices and timestamps in the page so project teams see immediate state changes.
- [ ] Surface Telegram command state, mission digest state, and raid automation state in the overview and activity rail.
- [ ] Keep the page project-private and avoid leaking any cross-project activity.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 6: Final verification

**Files:**
- Review all changed files in both repos
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Run the full portal build.
- [ ] Run the runtime typecheck and build.
- [ ] Verify the new v2 route still respects project scoping and that Telegram commands only activate when the bot token is configured.

---

## Self-Review

### Spec coverage

Covered in this plan:
- Raid Ops
- Missions
- Automations
- Telegram command layer
- richer member readiness and contributor views

Not covered intentionally:
- Captains
- newcomer funnels
- deep community analytics
- cohort tooling

### Placeholder scan

No `TODO`, `TBD`, or deferred implementation placeholders are left in the execution steps.

### Type consistency

The plan keeps one shared v2 settings contract centered on `community_bot_settings`, with portal UI, project APIs, and runtime jobs reading the same metadata-backed fields.
