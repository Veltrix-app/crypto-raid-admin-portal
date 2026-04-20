# Community OS Deepening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Community OS into the daily-use operating layer for project owners and captains, with stronger automation control, captain accountability, cohort tooling, and community health insights.

**Architecture:** Build strictly on the existing project-private Community OS foundation in `admin-portal` and `veltrix-community-bot`. Keep this phase focused on owner mode, captain mode, community automations, cohorts, and health read models. Do not pull member-facing webapp journey work or premium bot expansion into this phase; those stay reserved for `Phase 4` and `Phase 5`.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, existing Community OS panels and routes in `admin-portal`, existing community runtime helpers and jobs in `veltrix-community-bot`, Discord and Telegram execution rails as backend delivery targets only, Vercel, and Render.

---

## Scope Guardrails

This plan intentionally covers only `Phase 3: Community OS Deepening`.

In scope:
- owner automation control
- captain workspace deepening
- captain-safe permissions and accountability
- cohort and funnel tooling
- community health and outcome read models
- project-controlled automation sequencing and observability

Out of scope for this phase:
- new member-facing community webapp surfaces
- onboarding/comeback UI redesign in `veltrix-web`
- richer Discord/Telegram command UX beyond what is required to execute current community actions
- trust/reward/on-chain hardening beyond Community OS read models

---

## File Structure

### Database

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_community_os_phase3.sql`
  - extend community automation, captain action, cohort snapshot, and health rollup storage for Phase 3

### Portal shared logic

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-v5.ts`
  - extend aggregate loaders for automation health, captain coverage, due-state, resolution-state, and cohort summaries
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-execution.ts`
  - add safer sequencing, resolution, and owner/captain action boundaries
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-insights.ts`
  - deepen community health and participation/trust/reward quality signals
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-ops.ts`
  - ensure Phase 3 actions keep writing audit and incident rails

### Portal API routes

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-automations\route.ts`
  - deepen automation settings and sequencing
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-automations\[automationId]\run\route.ts`
  - keep manual automation runs lifecycle-safe
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-workspace\route.ts`
  - expand due, blocked, escalated, and recently resolved captain queue data
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-actions\[actionId]\run\route.ts`
  - keep captain run-now scoped and auditable
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-permissions\route.ts`
  - deepen seat scopes and allowed action toggles
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-growth\route.ts`
  - cohort, funnel, activation, and trust-leaning aggregate signals
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-outcomes\route.ts`
  - funnel conversion, captain effectiveness, and automation health outcomes
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-recommendations\route.ts`
  - stronger owner-facing recommended next plays

### Portal UI

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
  - compose the deeper owner and captain surfaces
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\community-config.ts`
  - extend contracts for automation sequencing, captain accountability, cohort summaries, and health signals
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverviewPanel.tsx`
  - sharpen owner summary and next-play framing
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityAutomationCenterPanel.tsx`
  - move from raw settings to real control center behavior
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityPlaybooksPanel.tsx`
  - sequence playbooks and expose execution posture
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainWorkspacePanel.tsx`
  - deepen priority, due, resolution, and accountability rails
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainOpsPanel.tsx`
  - owner-side captain coverage and seat management
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainsPanel.tsx`
  - captain roster and seat quality
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCohortsPanel.tsx`
  - newcomer, active, reactivation, high-trust, and watchlist segments
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityFunnelsPanel.tsx`
  - funnel posture and conversion
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityAnalyticsPanel.tsx`
  - community health and retention-oriented read models
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOutcomesPanel.tsx`
  - automation and captain outcome views
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
  - execution feed, captain actions, and automation history

### Runtime

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\automations.ts`
  - deepen automation planning and sequencing
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captains.ts`
  - captain permission scope resolution
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captain-queue.ts`
  - due, blocked, escalated, and resolved queue logic
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\outcomes.ts`
  - aggregate automation, captain, and cohort outcomes
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\playbooks.ts`
  - sequencing and observability for multi-step community runs
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\run-community-automations.ts`
  - scheduled automation execution
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\refresh-community-status-snapshots.ts`
  - keep cohort and health rollups fresh
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts`
  - expose any new internal job hooks safely

---

## Task 1: Add Phase 3 schema and contracts for deeper community operating state

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_community_os_phase3.sql`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\community-config.ts`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Extend community automation definitions with sequencing metadata, execution posture, and owner-facing labels.
- [ ] Extend captain queue/action storage with explicit `due`, `blocked`, `escalated`, and `resolved` fields plus actor attribution.
- [ ] Add durable cohort and health snapshot support so owner mode can read fast aggregates without member-CRM drift.
- [ ] Extend shared community TypeScript contracts for automation health, captain coverage, cohort summaries, and recommended plays.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 2: Deepen project-private loaders and API routes for owner and captain rails

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-v5.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-execution.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-insights.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-automations\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-workspace\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-permissions\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-growth\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-outcomes\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-recommendations\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-actions\[actionId]\run\route.ts`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Keep every new owner/captain/community read strictly filtered by `project_id` and the current viewer scope.
- [ ] Return richer automation posture, funnel conversion, captain accountability, and cohort health data without leaking raw member details.
- [ ] Preserve incident/audit logging for captain runs and owner-triggered overrides.
- [ ] Make captain action execution resolve against explicit permission scopes instead of broad title checks.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 3: Expand owner mode into a real control center

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverviewPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityAutomationCenterPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityPlaybooksPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOutcomesPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Surface a stronger `recommended next play` rail with launch-pressure language, not generic admin metrics.
- [ ] Turn automations into a control center with cadence, next run, last run, pause state, and outcome confidence.
- [ ] Let owners see playbook sequencing and where a playbook is stalled, not just a list of presets.
- [ ] Make outcomes feel like operating feedback: funnel conversion, captain effectiveness, automation success, and unresolved pressure.
- [ ] Keep the page aggregate-first and resist turning it into a member-detail CRM.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 4: Deepen captain mode into a real execution workspace

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainWorkspacePanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainOpsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Give captains clear priority, due, blocked, escalated, and resolved states.
- [ ] Show which actions belong to the current captain and why they are in their queue.
- [ ] Add accountability history that shows who ran what, when, and with what outcome.
- [ ] Keep captain permissions meaningful but bounded, so captains can act without seeing owner-only configuration rails.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 5: Add project-controlled automation sequencing and safer execution in the runtime

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\automations.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\playbooks.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\run-community-automations.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts`
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Sequence welcome flows, comeback nudges, mission digest, leaderboard cadence, raid reminders, and activation boards under one predictable planning model.
- [ ] Preserve pause, resume, run-now, and failure visibility rather than silently retrying everything.
- [ ] Write execution outputs so owner mode can answer what fired, what failed, and what needs intervention.
- [ ] Keep provider delivery as an execution detail, not a reason to leak bot-specific complexity into the portal.
- [ ] Run `npm run typecheck --workspace veltrix-community-bot` and `npm run build --workspace veltrix-community-bot`.

## Task 6: Deepen cohort tooling and community health insights

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCohortsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityFunnelsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityAnalyticsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityMembersPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-insights.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\outcomes.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\refresh-community-status-snapshots.ts`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run typecheck --workspace veltrix-community-bot`

- [ ] Make newcomer, active contributor, reactivation, high-trust, and watchlist segments feel operationally useful rather than decorative.
- [ ] Add health signals tied to participation, conversion, retention, trust posture, and reward quality.
- [ ] Keep this phase aggregate-led: surface segment pressure and readiness, not per-member management workflows.
- [ ] Refresh derived read models so Community OS remains fast under heavier project use.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal` and `npm run typecheck --workspace veltrix-community-bot`.

## Task 7: Harden captain-safe permissions and action scopes end-to-end

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainOpsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-permissions\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captains.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captain-queue.ts`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run typecheck --workspace veltrix-community-bot`

- [ ] Move captain permissions from “can probably do this” toward explicit seat-based scopes.
- [ ] Separate owner-only community settings from captain-run execution surfaces.
- [ ] Ensure run-now and resolve flows always attribute the acting captain or owner.
- [ ] Keep the permission model project-private and auditable.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal` and `npm run typecheck --workspace veltrix-community-bot`.

## Task 8: Final verification, rollout, and acceptance checklist

**Files:**
- Review all changed portal, runtime, and migration files
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Run the final portal and runtime verification commands.
- [ ] Explicitly call out `veltrix_community_os_phase3.sql` as a required manual Supabase step before rollout.
- [ ] Explicitly call out `veltrix-community-bot` redeploy as part of rollout.
- [ ] Verify live acceptance on:
  - owner mode in `/projects/<id>/community`
  - captain mode in `/projects/<id>/community`
  - automation center cadence and run posture
  - cohort and funnel read models
  - captain action run and accountability history
  - playbook sequencing and outcome visibility

---

## Self-Review

### Spec coverage

This plan covers the roadmap Phase 3 deliverables:
- owner automation control
- captain workspace and accountability
- project-controlled automations
- cohort tooling
- community health insights
- captain-safe permissions

Intentionally left for later phases:
- member-facing journey expansion in `veltrix-web`
- richer Discord/Telegram product experience
- wider trust/reward/on-chain hardening

### Placeholder scan

No `TODO`, `TBD`, or deferred placeholders remain in the task list.

### Type and boundary consistency

The plan keeps boundaries clean:
- `admin-portal` owns owner/captain operations
- `veltrix-community-bot` owns execution and rollups
- `Phase 4` owns member-facing journey expansion
- `Phase 5` owns bot excellence

