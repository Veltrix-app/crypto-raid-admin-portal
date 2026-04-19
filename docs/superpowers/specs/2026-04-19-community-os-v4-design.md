# Community OS V4 Design

**Date:** 2026-04-19  
**Product Surface:** `admin-portal` + `veltrix-community-bot`  
**Primary Route:** `/projects/[id]/community`

## Goal

Turn Community OS from a project-private control room into a true **community execution engine**.

V1 made Community OS real.  
V2 added missions, raids, automations, and Telegram command rails.  
V3 added captains, cohorts, activation boards, trust overlays, and community analytics.

V4 should make Veltrix actively **run** community operations instead of only showing or manually triggering them.

Projects should be able to:
- schedule and automate community plays
- assign captains with explicit permissions
- onboard new members into starter rails
- reactivate dormant contributors with comeback flows
- run reusable playbooks for launches, raid weeks, and campaign pushes
- review what was executed, by whom, and with what outcome

This is the step where Community OS becomes sticky enough that projects feel operationally dependent on it.

## Product Positioning

Community OS v4 is not:
- a dashboard full of manual buttons
- a generic cron wrapper
- a moderation-only bot console

It is:
- a project-private execution engine
- a captain-led community operations system
- a repeatable campaign activation layer
- a contributor movement machine from newcomer to core operator

The selling point becomes:

> "Veltrix does not just show your community data. It runs your community motions with your team."

## Core Shift

V3 gave projects visibility into:
- who is active
- who is ready
- what campaigns need pressure
- who could lead

V4 must answer:
- what should happen automatically next
- which captain is responsible
- what message or play should fire
- what happened when it ran

That means Community OS must gain four durable systems:

1. **Automation Engine**
2. **Captain Permission System**
3. **Onboarding and Reactivation Flows**
4. **Community Playbooks**

## Access Model

All Community OS v4 features stay **strictly project-private**.

Rules:
- Only project team members may configure or inspect the current project's Community OS v4 state.
- Captains are project-owned. A captain in one project has no visibility into another project's operations.
- Automation state, playbook runs, and community execution logs must be filtered by `project_id`.
- Veltrix internal moderation pages remain global. Community OS remains project-owned.

## Information Architecture Additions

Community OS route stays:
- `app/projects/[id]/community/page.tsx`

V4 adds four new sections:

### 1. Captain Ops

Purpose: make project-assigned captains operational, not symbolic.

Content:
- captain roster
- captain seat type
- allowed actions per captain
- recent captain-triggered actions
- captain health and readiness
- manual "act as captain" or "trigger now" rails for project owners

### 2. Automation Center

Purpose: configure scheduled community execution safely.

Content:
- enabled automations
- cadence
- target providers
- scope
- next run
- last run
- recent result
- pause, resume, and run now

### 3. Funnels

Purpose: move contributors through structured growth flows.

Content:
- newcomer starter funnel
- reactivation funnel
- welcome and onboarding flow
- readiness requirements per funnel
- last run and next run
- conversion snapshots

### 4. Playbooks

Purpose: give projects reusable community operating modes.

Content:
- launch week playbook
- raid week playbook
- comeback week playbook
- featured campaign blast
- captain-led escalation
- each playbook shows steps, cadence, and execution history

## V4 Major Capabilities

### A. Scheduled Automations

Projects need more than manual "post now" actions.

V4 automations should support:
- daily mission digest
- weekly leaderboard post
- raid reminder waves
- newcomer starter pulse
- reactivation pulse
- activation board pulse
- rank sync cadence

Automation rules:
- every automation is project-owned
- every automation can be paused
- every automation has a last and next execution state
- every automation writes an execution record
- execution failures remain visible to the project team

### B. Captain Permissions

Captains are useful only if they can actually operate a part of the system.

Captain permissions should support:
- post leaderboard now
- send raid alert
- send reminder wave
- send newcomer starter wave
- send reactivation wave
- trigger activation board
- run rank sync

Important:
- captain permissions are narrower than project owner and admin permissions
- permissions must be explicit, not implied by title
- captain-triggered actions should be logged with actor identity and project scope

### C. Welcome and Onboarding Funnels

The bot should help a new member become an active contributor.

Starter funnel stages:
1. join community
2. link account
3. complete first provider readiness
4. complete first mission
5. move into active contributor rail

Onboarding flow needs:
- starter copy template
- provider readiness prompts
- project-specific first-lane CTA
- optional follow-up reminder if still incomplete

### D. Reactivation Funnels

Dormant contributors should not require manual digging every time.

Reactivation flow needs:
- dormant contributor cohort detection
- comeback wave post
- optional reminder
- campaign-targeted comeback CTA
- visibility into whether this rail is growing or stale

### E. Community Playbooks

Playbooks are reusable execution presets for project teams.

Initial playbooks:
- **Launch Week**
  - activation board
  - mission digest
  - leaderboard pulse
  - featured announcement
- **Raid Week**
  - raid alert
  - reminder waves
  - result wrap
- **Comeback Week**
  - reactivation pulse
  - starter lane refresh
  - leaderboard nudge
- **Campaign Push**
  - campaign-specific activation board
  - mission wave
  - reward nudge

Playbooks should be:
- editable per project
- runnable manually
- schedulable later
- fully logged

## Data Model Direction

V4 is the first Community OS tranche that benefits from dedicated execution records.

### Keep in `community_bot_settings.metadata`

Configuration-like state can remain here:
- captain permission toggles
- funnel enabled flags
- cadence preferences
- playbook defaults

### Add dedicated execution tables

Use durable tables for run history:

- `community_automations`
  - project-owned automation definitions
  - type, cadence, status, next_run_at, last_run_at

- `community_automation_runs`
  - one row per execution
  - success or failure, summary, triggered_by, metadata

- `community_playbook_runs`
  - one row per playbook execution
  - playbook type, steps executed, result, triggered_by

- `community_captain_actions`
  - captain-triggered actions
  - actor, action type, target, result

These tables should remain fully project-scoped and auditable.

## Runtime Architecture

V4 needs a clean split:

### Portal
- configure automation and playbooks
- display next and last runs
- show logs and outcomes
- allow manual trigger and pause or resume

### Runtime and Bot
- execute scheduled automations
- enforce captain permissions when commands or actions are invoked
- post through Discord and Telegram provider rails
- write execution rows and audit logs

### Shared Rules
- project ownership check before execution
- idempotent execution guards
- durable last and next run timestamps
- visible failure states

## UX Principles

- Community OS should feel like a **control room with execution**, not a spreadsheet.
- Prefer "what is running, what is next, what is blocked" over raw config inputs.
- Captain-facing actions should be obvious and bounded.
- Playbooks should feel opinionated and operational, not abstract.
- Automation state should be easy to trust:
  - enabled or paused
  - last run
  - next run
  - latest result

## Success Criteria

Community OS v4 is successful when a project owner can:
1. assign captains and define what they can do
2. schedule newcomer, reactivation, leaderboard, and activation-board automations
3. run a playbook like Launch Week or Raid Week
4. see exactly what ran, when, and with what result
5. let the community keep moving without manually pressing every button

## Risks

- If automation state remains only in ad-hoc metadata, execution history will become muddy.
- If captain permissions are not explicit, projects will not trust delegation.
- If playbooks are too abstract, teams will not use them daily.
- If V4 mixes global and internal ops with project-owned execution state, project privacy will erode.

## Recommendation

Ship V4 as the first **execution-focused** Community OS tranche:
- durable project-owned automation definitions
- captain permission rails
- onboarding and reactivation funnels
- reusable playbooks
- visible execution history

That is the step that makes Veltrix Community OS operationally indispensable.
