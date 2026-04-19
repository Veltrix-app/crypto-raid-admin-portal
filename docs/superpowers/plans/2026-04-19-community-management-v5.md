# Community OS V5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Community OS into a dual-track operating system where owners steer community operations, captains execute from a real workspace, and members progress through a personalized community journey in the webapp.

**Architecture:** Keep `/projects/[id]/community` as the project-private operations surface, add project-scoped captain and journey source tables plus derived snapshot tables, extend the portal with owner and captain execution rails, add a new member-facing community journey area in `veltrix-web`, and use `veltrix-community-bot` as the activation rail that deep-links members back into the right journey surfaces.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase service-role APIs, SQL migrations for project-scoped community state, `veltrix-community-bot` runtime jobs and provider rails, existing Community OS v1-v4 panels, existing live-user-data infrastructure in `veltrix-web`, and existing Discord and Telegram command and push flows.

---

## File Structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_community_os_v5.sql`
  - project-scoped captain assignments, captain action queue, member journeys, journey events, and member status snapshots

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainWorkspacePanel.tsx`
  - captain-facing queue, priorities, blocked actions, and run-now rails
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOutcomesPanel.tsx`
  - owner-facing conversion, captain effectiveness, automation health, and journey outcome summaries
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-v5.ts`
  - shared project-private loaders and mutators for captain workspace, recommended plays, and outcome read models
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-workspace\route.ts`
  - project-private read API for captain queue and daily priorities
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-recommendations\route.ts`
  - project-private API for recommended next play and owner summary cards
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-outcomes\route.ts`
  - project-private aggregate funnel, captain, and automation outcomes
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-actions\[actionId]\run\route.ts`
  - secure captain or owner run-now route for queue items

### New webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\community\page.tsx`
  - member-facing Community Home route
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\community\onboarding\page.tsx`
  - onboarding rail route
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\community\comeback\page.tsx`
  - comeback rail route
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\community\journey\route.ts`
  - member journey snapshot read API
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\community\journey\advance\route.ts`
  - route for completing journey actions and emitting journey events
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\community\community-home-screen.tsx`
  - member Community Home view
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\community\community-onboarding-screen.tsx`
  - onboarding journey UI
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\community\community-comeback-screen.tsx`
  - comeback journey UI
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\community\community-status-panel.tsx`
  - status, recognition, streak, and next unlock UI
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\hooks\use-community-journey.ts`
  - client hook for member journey fetch, mutate, and local cache patching

### New runtime files

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\journeys.ts`
  - journey event emission, nudge decisions, and snapshot refresh helpers
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captain-queue.ts`
  - build and resolve captain action queue items from automations and playbooks
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\outcomes.ts`
  - project-scoped aggregate outcome recomputation
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\refresh-community-status-snapshots.ts`
  - scheduled snapshot refresh and aggregate projection
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\community-journeys.ts`
  - secure runtime endpoints for journey nudges and deep-link orchestration

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
  - compose owner and captain modes with new V5 data
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\community-config.ts`
  - extend shared contracts for captain queue, outcomes, and recommended plays
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverviewPanel.tsx`
  - show recommended next play, conversion posture, and captain readiness
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
  - include journey nudges, captain queue outcomes, and member journey-triggered runs
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityAutomationCenterPanel.tsx`
  - surface journey-linked automations and their outcomes
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityFunnelsPanel.tsx`
  - connect onboarding and comeback funnels to aggregate journey results

### Modified webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\home\home-screen.tsx`
  - add community entrypoint and next-best-action card
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\profile\profile-screen.tsx`
  - expose community status, streak, and recognition summary
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\notifications\notifications-screen.tsx`
  - make bot and journey nudges deep-link into the new community routes
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\hooks\use-live-user-data.ts`
  - integrate community journey snapshot dataset without reintroducing global overfetch

### Modified runtime files

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts`
  - add job entrypoints for journey snapshot refresh and captain queue refresh
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\index.ts`
  - register V5 routes and V5 snapshot job
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\commands.ts`
  - add captain prompts and member journey deep links
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\bot.ts`
  - add member onboarding and comeback prompts plus captain-safe deep links

---

## Task 1: Add V5 schema for captain queue and member journey state

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_community_os_v5.sql`
- Test: schema review only

- [ ] Create `community_captain_assignments` for project-scoped captain seats, role type, permission scope, and active status.
- [ ] Create `community_captain_action_queue` for owner-assigned or automation-generated captain work with status, due time, and escalation state.
- [ ] Create `community_member_journeys` for per-project member journey envelopes such as onboarding, active, and comeback.
- [ ] Create `community_member_journey_events` for step completions, nudges, resets, returns, and milestone unlocks.
- [ ] Create `community_member_status_snapshots` for fast member-facing reads and project aggregate calculations.
- [ ] Add indexes for `project_id`, `auth_user_id`, `status`, `due_at`, and `updated_at`.
- [ ] Apply the same project-private posture used by Community OS tables and explicitly note that this SQL must be run manually in Supabase before V5 code deploys.

## Task 2: Build shared V5 contracts and project-private loaders in the portal

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-v5.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\community-config.ts`
- Test: `npm run build`

- [ ] Add shared TypeScript contracts for captain queue items, owner recommendations, journey outcomes, and aggregate community health signals.
- [ ] Build one project-private loader that combines V4 execution history with V5 captain and journey-derived metrics.
- [ ] Keep member-facing detail out of this helper; expose only aggregate or action-oriented data for the portal.
- [ ] Reuse existing project access helpers so no cross-project queue or outcome data can leak.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 3: Add project-private portal APIs for owner and captain V5 rails

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-workspace\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-recommendations\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-outcomes\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-actions\[actionId]\run\route.ts`
- Test: `npm run build`

- [ ] Add a route that serves the captain workspace queue, priorities, blocked items, and recent action results for the current project.
- [ ] Add a route that computes and returns the owner-facing recommended next play.
- [ ] Add a route that returns aggregate onboarding, comeback, captain, and automation outcomes for the current project.
- [ ] Add a secure run-now route that lets an allowed captain or project owner execute one queue action without bypassing permission checks.
- [ ] Ensure every route records the triggering actor and filters by `project_id`.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 4: Expand the Community OS portal into owner mode and captain mode

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainWorkspacePanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOutcomesPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverviewPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityAutomationCenterPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityFunnelsPanel.tsx`
- Test: `npm run build`

- [ ] Add a visible owner-mode summary rail that surfaces recommended next play, automation posture, funnel conversion, and captain coverage.
- [ ] Add a captain-mode workspace with `My actions`, `Today's priorities`, `Blocked`, `Run now`, and `Recent results`.
- [ ] Keep the portal aggregate-first: show cohort and journey outcomes without drifting into a member CRM.
- [ ] Wire all V5 actions through the new project-private APIs.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 5: Add member journey APIs and client hooks in the webapp

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\community\journey\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\community\journey\advance\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\hooks\use-community-journey.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\hooks\use-live-user-data.ts`
- Test:
  - `npm run typecheck --workspace veltrix-web`
  - `npm run build --workspace veltrix-web`

- [ ] Add a member journey snapshot read route that returns the current project-aware community status, next best action, streak, recognition, and lane state.
- [ ] Add a journey advance route that records onboarding and comeback step completions without double-awarding state transitions.
- [ ] Build a focused `useCommunityJourney` hook instead of pushing V5 back into one oversized live-data hook.
- [ ] Integrate community journey snapshot loading into the existing cache model without reintroducing global overfetch.
- [ ] Run `npm run typecheck --workspace veltrix-web` and `npm run build --workspace veltrix-web`.

## Task 6: Build member-facing Community Home, onboarding rail, and comeback rail

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\community\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\community\onboarding\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\community\comeback\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\community\community-home-screen.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\community\community-onboarding-screen.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\community\community-comeback-screen.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\community\community-status-panel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\home\home-screen.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\profile\profile-screen.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\notifications\notifications-screen.tsx`
- Test:
  - `npm run typecheck --workspace veltrix-web`
  - `npm run build --workspace veltrix-web`

- [ ] Add a Community Home route that shows next best action, current lane, streak, recognition, and next unlock.
- [ ] Add an onboarding route that stages provider readiness, wallet verification, first mission, and first community milestone.
- [ ] Add a comeback route that highlights what changed, what action matters now, and what fast unlock is available.
- [ ] Add deep-link-safe notification cards and prompts so bot-driven journey nudges land on the correct screen.
- [ ] Run `npm run typecheck --workspace veltrix-web` and `npm run build --workspace veltrix-web`.

## Task 7: Add runtime journey logic, captain queue generation, and snapshot refresh

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\journeys.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captain-queue.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\outcomes.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\refresh-community-status-snapshots.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\community-journeys.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\index.ts`
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Build journey helpers that emit onboarding and comeback events and update journey envelopes safely.
- [ ] Build captain queue generation from due automations, playbooks, and manual owner pushes.
- [ ] Build outcome projection helpers for onboarding conversion, comeback conversion, captain effectiveness, and automation performance.
- [ ] Add a scheduled snapshot refresh job so portal aggregates and member-facing read models stay fast.
- [ ] Run `npm run typecheck --workspace veltrix-community-bot` and `npm run build --workspace veltrix-community-bot`.

## Task 8: Wire Discord and Telegram into the member journey and captain workspace

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\commands.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\bot.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\community.ts`
- Reuse: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\journeys.ts`
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Add journey-aware onboarding and comeback nudges that deep link into `/community`, `/community/onboarding`, or `/community/comeback`.
- [ ] Add captain-focused prompts that deep link into the project-private workspace or run-now actions.
- [ ] Ensure nudges are project-scoped and idempotent so members do not get spammed by repeated automation runs.
- [ ] Keep bots as activation rails and avoid turning Discord or Telegram into the full member journey surface.
- [ ] Run `npm run typecheck --workspace veltrix-community-bot` and `npm run build --workspace veltrix-community-bot`.

## Task 9: Final verification, rollout notes, and live QA checklist

**Files:**
- Review all changed portal, webapp, runtime, and migration files
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run typecheck --workspace veltrix-web`
  - `npm run build --workspace veltrix-web`
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Run the full portal, webapp, and runtime verification commands after wiring V5 together.
- [ ] Confirm `veltrix_community_os_v5.sql` is explicitly called out as a required manual Supabase step.
- [ ] Confirm `veltrix-community-bot` needs a Render redeploy after the runtime changes land.
- [ ] Run a live checklist that covers:
  - owner recommended next play
  - captain queue item run
  - member onboarding rail
  - member comeback rail
  - Discord or Telegram journey deep link
  - portal outcome history visibility

---

## Self-Review

### Spec coverage

Covered in this plan:

- owner-facing operations and recommended next play
- captain workspace and queue
- member-facing Community Home, onboarding, and comeback surfaces
- journey events and status snapshots
- bot deep links into the webapp
- aggregate outcomes for launch-proof measurement

Not covered intentionally:

- CRM-style member exploration in the portal
- advanced experimentation tooling
- predictive personalization beyond rule-based next best action
- cross-project community orchestration

### Placeholder scan

No `TODO`, `TBD`, or deferred implementation placeholders remain in the task structure.

### Type and boundary consistency

The plan keeps:

- portal as the aggregate operations and captain workspace surface
- webapp as the member journey surface
- bots as the activation rail
- database events and runs as source-of-truth
- snapshots and aggregates as derived read models

That preserves the V5 design guardrails while giving each surface a clear job.
