# Community Management V4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Community OS into a true project-private execution engine with scheduled automations, captain permissions, onboarding and reactivation funnels, reusable playbooks, and durable execution history across portal and runtime.

**Architecture:** Keep `/projects/[id]/community` as the project-owned control room, add dedicated project-scoped execution tables for automations, runs, playbook runs, and captain actions, extend the portal with Automation Center, Captain Ops, Funnels, and Playbooks sections, and make `veltrix-community-bot` the execution runtime that enforces project ownership, captain permissions, and idempotent scheduled runs.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase service-role APIs, SQL migrations for new project-scoped execution tables, existing Discord and Telegram provider rails, existing community push routes, and the current Veltrix runtime jobs stack.

---

## File Structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_community_os_v4.sql`
  - project-scoped automation, execution-history, and captain-action tables plus indexes and RLS posture

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityAutomationCenterPanel.tsx`
  - automation list, cadence controls, run-now, pause, and recent result surface
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainOpsPanel.tsx`
  - captain permission grid, seat ownership, captain action history, and owner overrides
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityFunnelsPanel.tsx`
  - onboarding and reactivation funnel configuration, stats, and manual trigger rails
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityPlaybooksPanel.tsx`
  - playbook presets, step summaries, manual runs, and history surface
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-execution.ts`
  - shared server-side loader and action helpers for automations, playbooks, captain permissions, and execution history
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-automations\route.ts`
  - project-private read and write API for automation definitions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-automations\[automationId]\run\route.ts`
  - manual run trigger for one automation
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-playbooks\route.ts`
  - project-private playbook configuration and read API
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-playbooks\[playbookKey]\run\route.ts`
  - manual playbook execution route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-permissions\route.ts`
  - captain seat and permission management route

### New runtime files

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\automations.ts`
  - load due automations, enforce cadence, and execute project-scoped automation types
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\playbooks.ts`
  - execute reusable project playbooks step-by-step with logging
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captains.ts`
  - resolve captain permissions and record captain-triggered actions
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\run-community-automations.ts`
  - scheduled runner for due automations
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\community-ops.ts`
  - secure runtime routes for manual automation and playbook execution

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
  - compose new v4 sections and wire project-private execution actions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\community-config.ts`
  - extend shared contracts with v4 config defaults where appropriate
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverviewPanel.tsx`
  - show automation posture, next run, captain seats, and playbook health
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
  - include execution history, failures, and captain-triggered actions

### Modified runtime files

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts`
  - add job entrypoint for scheduled Community OS v4 automation execution
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\index.ts`
  - register v4 community routes and boot the scheduled execution rail
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\commands.ts`
  - enforce captain permissions for manual captain actions where commands apply
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\bot.ts`
  - enforce captain permissions and expose captain-safe triggers where useful

---

## Task 1: Add project-scoped execution schema for Community OS v4

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_community_os_v4.sql`
- Test: schema review only

- [ ] Create `community_automations` with project-owned automation definitions, cadence, status, last and next run timestamps, provider scope, and config payload.
- [ ] Create `community_automation_runs` for one row per execution with result, summary, actor, automation type, and metadata.
- [ ] Create `community_playbook_runs` for durable playbook execution history.
- [ ] Create `community_captain_actions` for explicit captain-triggered action logging.
- [ ] Add indexes for `project_id`, `status`, and `next_run_at` lookups so the runtime can efficiently load due work.
- [ ] Add RLS and access posture that keeps these tables project-private for portal reads and service-role-only for runtime writes where appropriate.
- [ ] Explicitly note in the final rollout that this SQL must be run manually in Supabase before the v4 runtime is deployed.

## Task 2: Build shared portal loaders and action helpers for execution state

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\community\project-community-execution.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\community-config.ts`
- Test: `npm run build`

- [ ] Build one shared server-side helper that loads project-owned automations, recent automation runs, playbook runs, captain permissions, and funnel posture.
- [ ] Keep defaults opinionated: paused by default for new automations unless a preset explicitly recommends active.
- [ ] Extend the shared config contract only for configuration-like values that truly belong in metadata; keep run history in dedicated tables.
- [ ] Reuse existing project auth helpers so no cross-project execution data can leak.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 3: Add project-private portal APIs for v4 execution management

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-automations\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-automations\[automationId]\run\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-playbooks\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-playbooks\[playbookKey]\run\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\community-captain-permissions\route.ts`
- Test: `npm run build`

- [ ] Add a project-private automations route that supports listing, creating, updating, pausing, and resuming community automations.
- [ ] Add a manual automation run route that securely proxies to the runtime and writes a corresponding portal-side audit event.
- [ ] Add playbook read and run routes scoped to the current project.
- [ ] Add captain permission management that only allows project-owned members or approved contributor seats to receive captain capabilities.
- [ ] Ensure every route filters on `project_id` and records who triggered changes.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 4: Build the new v4 Community OS panels in the portal

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityAutomationCenterPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityCaptainOpsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityFunnelsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityPlaybooksPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityOverviewPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\community\CommunityActivityPanel.tsx`
- Test: `npm run build`

- [ ] Build an Automation Center that shows enabled state, cadence, provider scope, next run, last run, last result, and run-now or pause controls.
- [ ] Build a Captain Ops panel that makes captain seats, explicit permissions, recent actions, and owner overrides readable and editable.
- [ ] Build a Funnels panel for welcome, onboarding, and reactivation flows with readiness criteria, status, and trigger actions.
- [ ] Build a Playbooks panel with opinionated presets like Launch Week, Raid Week, Comeback Week, and Campaign Push plus recent history.
- [ ] Update overview and activity so automation posture and execution health are visible without scrolling through every section.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 5: Implement runtime execution rails for automations and playbooks

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\automations.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\playbooks.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captains.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\run-community-automations.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\community-ops.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\http\jobs.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\index.ts`
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Build a runtime loader that fetches due automations by `next_run_at`, project scope, and status.
- [ ] Implement automation execution types for leaderboard pulse, mission digest, activation board pulse, newcomer pulse, reactivation pulse, and rank sync.
- [ ] Implement playbook runners that execute ordered steps, log each run, and keep manual triggers idempotent.
- [ ] Add secure runtime routes for manual automation and playbook execution from the portal.
- [ ] Record success and failure state back into execution tables with durable last and next run timestamps.
- [ ] Run `npm run typecheck --workspace veltrix-community-bot` and `npm run build --workspace veltrix-community-bot`.

## Task 6: Enforce captain permissions across manual triggers

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\discord\commands.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\providers\telegram\bot.ts`
- Reuse: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\community\captains.ts`
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Add captain permission resolution so only allowed captains can trigger protected community actions.
- [ ] Keep project owners able to override and run actions directly from the portal.
- [ ] Record captain-triggered actions in `community_captain_actions`.
- [ ] Ensure captain permissions remain explicit and project-scoped, never inferred across projects.
- [ ] Run `npm run typecheck --workspace veltrix-community-bot` and `npm run build --workspace veltrix-community-bot`.

## Task 7: Wire the Community OS page into one coherent execution surface

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Reuse: v1-v3 panels plus new v4 panels and routes
- Test: `npm run build`

- [ ] Load v4 execution payloads alongside existing v1-v3 data without making the page feel like a pile of forms.
- [ ] Add notice, refresh, and action-state handling for automation saves, playbook runs, captain permission updates, and funnel triggers.
- [ ] Keep the page readable as one control room: overview, members, missions, raids, automations, captains, funnels, playbooks, analytics, and activity should feel intentional.
- [ ] Preserve strict project privacy on every read and mutation.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.

## Task 8: Final verification and rollout notes

**Files:**
- Review all changed portal, runtime, and migration files
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Run the full portal build and runtime verification commands after wiring everything together.
- [ ] Confirm the new SQL migration is explicitly called out as a required manual Supabase step.
- [ ] Confirm the runtime needs a Render redeploy after the portal and database changes land.
- [ ] Re-read the Community OS route to ensure earlier v1-v3 capabilities still render correctly.

---

## Self-Review

### Spec coverage

Covered in this plan:
- scheduled automations
- captain permissions and captain action rails
- welcome and onboarding funnels
- reactivation funnels
- reusable playbooks
- execution history and project-scoped run logs

Not covered intentionally:
- cross-project community operations
- a second global ops console
- new chain-indexing work unrelated to Community OS execution

### Placeholder scan

No `TODO`, `TBD`, or deferred implementation placeholders are left in the task structure.

### Type and boundary consistency

The plan keeps configuration in portal-owned contracts, execution history in dedicated project-scoped tables, and real runtime work in `veltrix-community-bot`. That preserves the project-private Community OS model while finally making the surface capable of durable autonomous operations.
