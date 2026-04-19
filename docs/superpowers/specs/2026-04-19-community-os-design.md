# Community OS Design

**Date:** 2026-04-19  
**Product Surface:** `admin-portal`  
**Primary Route:** `/projects/[id]/community`

## Goal

Build a project-private Community Management system that turns Veltrix from a verification and push layer into a daily-use community operating system for project teams.

Projects should be able to manage only their own Discord and Telegram communities from one place:
- configure and test integrations
- manage ranks and role ladders
- manage leaderboards and posting cadence
- review community activity and incidents
- later orchestrate raids, missions, automations, captains, and analytics

This surface must become a selling point, not just a settings page.

## Product Positioning

Veltrix Community OS is not:
- a generic moderation bot
- a one-off announcement tool
- a loose set of bot controls buried inside project settings

It is:
- a project-scoped community control room
- a contributor activation system
- a reputation and rank management layer
- a raid coordination and community growth layer

The long-term promise is that projects should feel they run their community through Veltrix rather than around it.

## Access Model

This page is **strictly project-private**.

Rules:
- Route access is limited to users who belong to the selected project.
- All data must be filtered by `project_id` or by `integration_id` owned by that project.
- One project must never see another project's guild IDs, chat IDs, rank ladders, incident logs, or activity rails.
- Global operations remain on Veltrix internal pages like moderation and claims, not on the project community page.

## Information Architecture

### New Route

- `app/projects/[id]/community/page.tsx`

### Existing Project Detail Role After This Change

`app/projects/[id]/page.tsx` should stop acting as the main community control surface. It should keep only:
- small readiness hints
- a compact summary card
- a CTA linking to `Open Community Management`

### Community Management Sections

#### 1. Overview

Purpose: give a project manager instant awareness of the health of their community setup.

Content:
- Discord status
- Telegram status
- commands enabled
- ranks enabled
- leaderboards enabled
- last command sync
- last rank sync
- last leaderboard post
- linked member count
- wallet-verified member count
- open community incidents

#### 2. Integrations & Channels

Purpose: manage the live targets the bot acts against.

Content:
- Discord guild ID
- Discord channel / thread targets
- Telegram chat ID
- test push actions
- sync Discord commands
- integration readiness summaries

#### 3. Ranks & Roles

Purpose: make Discord rank sync and role mapping operable by project teams.

Content:
- quick ladders / presets
- manual ladder editing
- role ID mapping
- default rank source
- preview of configured ladder
- sync ranks now
- last sync timestamp

#### 4. Leaderboards

Purpose: manage leaderboard scope and posting behavior.

Content:
- enabled toggle
- scope
- period
- cadence
- top N
- target channel override
- post now
- last leaderboard posted at

#### 5. Commands

Purpose: control the command surface the community sees.

Content:
- commands enabled toggle
- available command rail
- command sync action
- later per-command toggles

#### 6. Activity & Incidents

Purpose: give project teams local visibility into community bot operations without exposing global ops.

Content:
- latest command syncs
- latest leaderboard posts
- failed or skipped community actions
- failed push attempts scoped to the project
- latest rank sync results

## Launch-Ready V1 Scope

The first release of Community OS should stay intentionally tight.

### In Scope

- new project-private `/projects/[id]/community` page
- Overview
- Integrations & Channels
- Ranks & Roles
- Leaderboards
- Commands
- Activity & Incidents
- migration of existing Discord community bot controls off the project detail page

### Out of Scope for V1

- full raid orchestration UI
- mission board management
- captains / ambassador management
- automation scheduling UI
- rich community analytics
- Telegram command parity

These belong to follow-up phases once the core page is stable.

## V2 Scope

Once the v1 page is stable, expand with:
- Raid Ops
- Missions
- Automations
- Telegram command layer
- richer member readiness and contributor views

## V3 Scope

Later expansion:
- Captains
- contributor cohorts
- newcomer funnels
- reactivation funnels
- community analytics
- advanced trust and quality overlays
- campaign-specific activation boards

## UX Principles

- Treat this as a daily operations page, not a setup form.
- Lead with state and health, not raw inputs.
- Prefer grouped operations over scattered buttons.
- Show consequences of settings:
  - what is enabled
  - where it posts
  - when it last ran
  - what is currently broken
- Keep the project detail page lighter by moving community management into its own route.

## Data Boundaries

Community OS v1 should consume existing project-scoped sources where possible:
- `project_integrations`
- `community_bot_settings`
- `community_rank_rules`
- `community_subscriptions`
- project-scoped `admin_audit_logs`
- project-scoped member and reputation snapshots already available through the admin portal store and Supabase reads

No new schema is required for the first page extraction itself.

## Success Criteria

V1 is successful when a project owner can:
1. open a dedicated community page for their project
2. verify Discord and Telegram targets
3. load a rank ladder preset, map roles, save, and sync ranks
4. configure leaderboard settings and post a leaderboard
5. see recent community bot activity and know whether anything failed

## Risks

- Leaving community controls duplicated on the project detail page will create drift and confusion.
- Mixing project-scoped and global ops on one page will create access-control mistakes.
- Expanding too early into raids, captains, and analytics will delay the core launch-value surface.

## Recommendation

Ship Community OS as a focused v1 extraction first:
- dedicated route
- project-private access
- strong Discord and Telegram operations
- clean rank and leaderboard experience

Then expand into raids and automations from a solid base.
