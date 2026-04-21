# Analytics, Observability, and Runbooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish `Phase 7` by turning the current mix of analytics pages, incident rails, and docs into one operator-grade observability layer that makes launch posture, queue pressure, provider failures, deployment hygiene, and recovery playbooks visible and actionable.

**Architecture:** Keep the existing trust, payout, on-chain, claims, moderation, community, and platform-incident systems as the operational source of truth. Add a thin analytics and observability layer on top of them: metric snapshots for trend views, health aggregators for live posture, support-escalation rails for cross-surface follow-through, and a runbook center that keeps recovery paths visible inside the portal. `Overview` becomes the launch and health command center, `Analytics` becomes the outcomes and trend board, and the existing operational pages remain the domain-specific execution rails.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `admin-portal`, `veltrix-community-bot`, existing project-private auth helpers, existing case systems (`trust`, `payout`, `onchain`, `project_operation_incidents`), Vercel, Render, and `docs/superpowers`.

---

## Scope Guardrails

This plan intentionally covers only `Phase 7`:

- cross-product metrics that matter
- live provider and queue observability
- support and escalation posture
- runbooks and recovery guidance
- deployment and environment hygiene
- operator-visible launch readiness

In scope:

- platform and project metric snapshots
- queue backlog and incident aggregation
- provider, automation, sync, and webhook health summaries
- support escalation rails and operator accountability
- in-product runbook discovery
- deployment and environment checklists
- upgrades to `Overview` and `Analytics`

Out of scope for this tranche:

- new trust business logic
- new payout business logic
- new on-chain business logic
- community OS feature expansion
- member-facing webapp expansion
- bot experience changes outside observability hooks

---

## File Structure

### Database

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_analytics_observability_runbooks.sql`
  - add metric snapshot and escalation tables

### Portal shared logic

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\analytics\metric-definitions.ts`
  - metric keys, labels, sections, and threshold helpers
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\analytics\platform-metrics.ts`
  - platform-wide read models for activation, retention, readiness, claim pressure, trust posture, and automation health
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\analytics\project-metrics.ts`
  - project-scoped outcome and readiness shaping
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\observability\health.ts`
  - aggregate health summaries across incidents, queues, provider failures, webhook failures, sync failures, and automation drift
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\observability\deploy-checks.ts`
  - environment and deployment posture helpers for Vercel, Render, Supabase, secrets, and webhook config
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\support\escalations.ts`
  - support escalation shaping, lifecycle rules, and history
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\runbooks\runbook-registry.ts`
  - curated runbook metadata, labels, and route mappings

### Portal API routes

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\analytics\platform-summary\route.ts`
  - platform outcome and trend metrics
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\analytics\project-summary\route.ts`
  - project-level readiness and outcome metrics
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\ops\health\route.ts`
  - live health summary across incidents, queues, providers, and automations
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\ops\deploy-checks\route.ts`
  - deployment and environment posture read route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\ops\escalations\route.ts`
  - support escalation list and summary route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\ops\escalations\[escalationId]\route.ts`
  - escalation detail and state update route

### Portal UI

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
  - upgrade into the launch and observability command center
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\page.tsx`
  - upgrade into the trend and outcomes board
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\observability\LaunchHealthBoard.tsx`
  - launch-day posture, queue pressure, and critical signals
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\observability\ProviderHealthPanel.tsx`
  - provider, webhook, automation, sync, and push health
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\observability\QueueBacklogPanel.tsx`
  - cross-surface backlog and unresolved pressure
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\observability\SupportEscalationPanel.tsx`
  - escalations, ownership, and next actions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\observability\DeployCheckPanel.tsx`
  - deployment posture and environment hygiene
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\observability\RunbookRail.tsx`
  - in-product runbook entry points and recovery guidance

### Runtime and metric jobs

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\ops\metric-snapshots.ts`
  - snapshot writing helpers
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\ops\support-escalations.ts`
  - escalation record helpers
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\refresh-platform-metric-snapshots.ts`
  - periodic platform and project rollup generation
- existing provider, automation, payout, trust, and on-chain jobs
  - feed health counters and failure summaries into the snapshot layer

### Docs and runbooks

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-20-ops-runbook-outline.md`
  - existing base outline to expand
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-21-operator-runbooks.md`
  - concrete runbook pack for launch day and incident classes
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-21-deploy-hygiene-checklist.md`
  - Vercel, Render, Supabase, secrets, and webhook hygiene checklist

---

## Task 1: Add the metric snapshot and escalation foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_analytics_observability_runbooks.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\analytics\metric-definitions.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\ops\metric-snapshots.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\ops\support-escalations.ts`
- Test:
  - schema review
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run typecheck --workspace veltrix-community-bot`

- [ ] Add `platform_metric_snapshots` for daily or periodic platform rollups across activation, claim pressure, trust posture, payout posture, on-chain posture, and automation health.
- [ ] Add `project_metric_snapshots` for project-scoped readiness, activation, contributor quality, reward conversion, and community posture.
- [ ] Add `support_escalations` so cross-surface incidents can be tracked with status, severity, owner, source surface, and resolution history.
- [ ] Define the operator metrics that matter in one shared contract instead of ad hoc labels per page.
- [ ] Keep existing incidents, cases, and queue tables as the source of truth; the new tables are observability and support layers on top.

## Task 2: Build runtime snapshot generation and live health aggregation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\refresh-platform-metric-snapshots.ts`
- Modify existing jobs under:
  - `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs`
  - `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\observability\health.ts`
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Generate periodic platform and project metric snapshots from existing campaigns, quests, rewards, claims, trust cases, payout cases, on-chain cases, automations, and incidents.
- [ ] Normalize live health summaries for provider failures, queue backlog, webhook failures, sync drift, automation failures, and unresolved overrides.
- [ ] Surface stale-snapshot or missing-snapshot states explicitly so observability never looks healthy just because data stopped updating.
- [ ] Keep the runtime explainable: the snapshot layer should point back to the underlying cases and incidents, not hide them.
- [ ] Add hooks for support escalations so repeated unresolved failures can be lifted into a tracked escalation state.

## Task 3: Turn Overview into the launch and health command center

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\ops\health\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\observability\LaunchHealthBoard.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\observability\ProviderHealthPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\observability\QueueBacklogPanel.tsx`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Upgrade `Overview` from a generic pulse page into the operator command center for launch-day posture and current system pressure.
- [ ] Add clear work modes such as `Launch`, `Health`, and `Escalations` so the page stops mixing top-line metrics with recovery tasks.
- [ ] Show provider health, queue backlog, unresolved incidents, retry pressure, automation drift, and deployment posture in one scan.
- [ ] Let operators jump straight from a health problem into the owning surface such as `Claims`, `Moderation`, `On-chain`, or `Community`.
- [ ] Keep the active workspace context visible, but frame this page as platform control first.

## Task 4: Turn Analytics into the outcomes and trend board

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\analytics\platform-summary\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\analytics\project-summary\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\analytics\platform-metrics.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\analytics\project-metrics.ts`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Reframe `Analytics` around outcomes and trends instead of live operational triage.
- [ ] Add clear sections for activation, readiness, community conversion, claim conversion, trust posture, and on-chain reliability.
- [ ] Keep the existing campaign and verification intelligence, but place it under a stronger metrics contract and clearer trend framing.
- [ ] Make project filtering and drilldowns feel deliberate, not like a byproduct of the global store.
- [ ] Ensure analytics cards always link back to the relevant execution workspace when a metric needs action.

## Task 5: Add support escalations and operator accountability rails

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\support\escalations.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\ops\escalations\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\ops\escalations\[escalationId]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\observability\SupportEscalationPanel.tsx`
- Modify existing execution surfaces as needed:
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\onchain\page.tsx`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\community\page.tsx`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Add a support escalation layer for incidents that cross surfaces, repeat, or require named ownership.
- [ ] Let operators move a failure from local queue handling into an explicit escalation state with history and accountability.
- [ ] Show who owns the escalation, what the next action is, and whether it is waiting on internal work, project input, provider recovery, or deploy hygiene.
- [ ] Keep the escalation layer aligned with existing incident and case systems instead of inventing a second disconnected workflow.
- [ ] Make escalations visible from `Overview` and from the owning operational page.

## Task 6: Add runbook discovery and deployment hygiene rails

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\observability\deploy-checks.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\runbooks\runbook-registry.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\observability\DeployCheckPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\observability\RunbookRail.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\ops\deploy-checks\route.ts`
- Expand:
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-20-ops-runbook-outline.md`
- Create:
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-21-operator-runbooks.md`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-21-deploy-hygiene-checklist.md`
- Test:
  - docs review
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Bring runbooks into the product as a curated rail instead of leaving them as tribal knowledge or repo-only docs.
- [ ] Add a deployment and environment checklist that covers Vercel, Render, Supabase, secrets, callback URLs, webhook targets, and queue jobs.
- [ ] Show deployment and environment posture in the portal without exposing raw secrets.
- [ ] Keep runbooks short, operator-friendly, and mapped to the actual surface that needs intervention.
- [ ] Make the runbook layer usable under pressure, not just complete on paper.

## Task 7: Final verification and rollout

**Files:**
- Validate all touched portal files under:
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib`
- Validate runtime files under:
  - `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src`
- Rollout artifacts:
  - `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_analytics_observability_runbooks.sql`
  - expanded runbook docs under `docs/superpowers/specs`

- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.
- [ ] Run `npm run typecheck --workspace veltrix-community-bot`.
- [ ] Run `npm run build --workspace veltrix-community-bot`.
- [ ] Run the Supabase migration and redeploy the bot if the snapshot job or escalation hooks depend on runtime changes.
- [ ] Validate live acceptance on:
  - `/overview`
  - `/analytics`
  - `/claims`
  - `/moderation`
  - `/onchain`
  - `/projects/<id>/community`
- [ ] Confirm operators can answer these questions without leaving the product:
  - what is healthy
  - what is failing
  - what is trending
  - who owns the next action
  - what runbook applies

---

## Exit Criteria

- [ ] `Overview` works as a real operator command center during launch pressure.
- [ ] `Analytics` clearly separates outcomes and trends from live incident triage.
- [ ] Provider, queue, automation, and sync failures are visible and explainable in-product.
- [ ] Repeated or cross-surface issues can be escalated with named ownership and history.
- [ ] Runbooks and deploy hygiene are visible where operators actually need them.
- [ ] Phase 7 raises launch confidence, not just dashboard density.
