# Permissioned Payout Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the second `Phase 6` tranche as a real permissioned payout console with explicit payout cases, project-scoped visibility and action permissions, internal operator workflows, and auditable escalation and resolution rails.

**Architecture:** Keep the existing payout sources (`reward_claims`, `reward_distributions`, campaign finalization failures, reward inventory state) as execution inputs, but introduce a normalized payout-case layer for product use. `admin-portal` will expose two surfaces on top of that foundation: a full-control internal payout workspace and a project-private payout console. Sensitive actions must flow through explicit permissions, explicit case events, and explicit audit logging.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `admin-portal`, `veltrix-community-bot`, existing claims and rewards rails, existing project-private auth helpers, Vercel, and Render.

---

## Scope Guardrails

This plan intentionally covers only the second `Phase 6` tranche:

- reward / claim / payout safety
- internal operator payout workspace
- project-private payout console
- project payout permissions
- payout case, escalation, and resolution rails

In scope:

- normalized payout cases
- payout case events and history
- owner-managed visibility and action permissions
- internal claims queue and payout incident workflow
- project-private payout console on `/projects/[id]/payouts`
- audit logging for payout actions
- escalation and resolution state

Out of scope for this tranche:

- broader trust and fraud redesign
- full dispute arbitration system
- treasury-grade payout orchestration
- full on-chain observability overhaul
- cross-project finance dashboards

---

## File Structure

### Database

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_permissioned_payout_console.sql`
  - add `payout_cases`, `payout_case_events`, and `project_payout_permissions`

### Portal shared logic

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\payout\payout-config.ts`
  - shared types, labels, permission keys, and case status helpers
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\payout\project-payout-auth.ts`
  - project-private payout visibility and action checks layered on top of existing project access
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\payout\project-payout-cases.ts`
  - project-scoped case loaders, detail shaping, and permission-aware filtering
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\payout\internal-payout-cases.ts`
  - internal queue and case detail loaders
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\payout\payout-actions.ts`
  - annotate, escalate, retry, dismiss, resolve, and payout-safe override helpers
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\payout\payout-permissions.ts`
  - owner-managed visibility and action grants

### Portal API routes

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\payout\cases\route.ts`
  - internal payout queue read route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\payout\cases\[caseId]\route.ts`
  - internal payout case detail route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\payout\cases\[caseId]\events\route.ts`
  - internal payout case event timeline route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\payout\cases\[caseId]\actions\route.ts`
  - internal payout case action route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\payout-cases\route.ts`
  - project-private payout case list route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\payout-cases\[caseId]\route.ts`
  - permission-aware project payout case detail route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\payout-cases\[caseId]\actions\route.ts`
  - permission-aware project payout action route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\payout-permissions\route.ts`
  - owner-managed payout visibility and action permission route

### Portal UI

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims\page.tsx`
  - turn claims into the internal payout console entry surface
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\payouts\page.tsx`
  - new project-private payout console
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\PayoutQueuePanel.tsx`
  - internal payout queue
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\PayoutCaseDetailPanel.tsx`
  - case detail, payout evidence summary, and actions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\PayoutCaseTimeline.tsx`
  - event history and resolution log
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\PayoutHealthPanel.tsx`
  - payout health summary for internal and project views
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\ProjectPayoutPermissionsPanel.tsx`
  - owner-managed payout visibility and action grants
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\ProjectPayoutCasesPanel.tsx`
  - project payout case list and escalations
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\ProjectPayoutCaseDetailPanel.tsx`
  - permission-aware project payout case view

### Runtime and case shaping

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\payout\payout-cases.ts`
  - shared payout case creation and update helpers
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\finalize-campaign-payouts.ts`
  - upsert payout cases and events from campaign finalization failures
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\reward-claim-recovery.ts`
  - upsert payout cases from blocked or failed claim flows
- existing claim and reward jobs where payout incidents originate

---

## Task 1: Add the payout-case schema and permission foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_permissioned_payout_console.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\payout\payout-config.ts`
- Test:
  - schema review
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Add `payout_cases` with explicit `project_id`, optional `campaign_id`, optional `reward_id`, optional `claim_id`, optional `auth_user_id`, case type, severity, status, source system, evidence summary, raw payload, and resolution metadata.
- [ ] Add `payout_case_events` so every annotation, escalation, retry, dismissal, resolution, and payout override becomes a timeline event.
- [ ] Add `project_payout_permissions` with separate `visibility_permissions` and `action_permissions` payloads plus actor attribution.
- [ ] Define shared payout enums and labels in `payout-config.ts` for case types, statuses, visibility permissions, and action permissions.
- [ ] Keep the default project posture summary-first: project users get no extra payout capability until the owner grants it.

## Task 2: Normalize existing payout signals into payout cases

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\payout\payout-cases.ts`
- Modify payout-related runtime and retry jobs
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Map existing claim blocks, delivery failures, finalization failures, and reward inventory pressure into normalized payout case types such as `claim_review`, `claim_blocked`, `delivery_failure`, `reward_inventory_risk`, `campaign_finalization_failure`, `payout_dispute`, and `manual_payout_review`.
- [ ] Upsert payout cases instead of relying only on raw claim rows or audit logs as the product-facing source.
- [ ] Write payout case timeline events whenever a case is opened, updated, escalated, queued for retry, or auto-refreshed from new evidence.
- [ ] Preserve the raw evidence trail so internal operators can still inspect underlying claim or finalization details.
- [ ] Keep this tranche explainable: no silent payout suppression and no opaque case generation.

## Task 3: Build the internal payout workspace

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\payout\internal-payout-cases.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\payout\cases\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\payout\cases\[caseId]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\payout\cases\[caseId]\events\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\payout\cases\[caseId]\actions\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\PayoutQueuePanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\PayoutCaseDetailPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\PayoutCaseTimeline.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\PayoutHealthPanel.tsx`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Turn claims into a proper internal payout console with `Queue`, `Incidents`, `Disputes`, and `Resolution Log` modes.
- [ ] Let internal operators inspect member-level claim evidence, payout failure detail, wallet or delivery context, and related reward or campaign context.
- [ ] Support internal actions such as annotate, escalate, request project input, retry, dismiss, resolve, freeze reward, pause claim rail, and payout override.
- [ ] Keep the workspace case-driven instead of a loose mix of tables and retry buttons.
- [ ] Write every payout action into the case timeline and the broader audit rails.

## Task 4: Build the project-private payout console

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\payouts\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\payout\project-payout-auth.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\payout\project-payout-cases.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\payout-cases\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\payout-cases\[caseId]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\ProjectPayoutCasesPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\ProjectPayoutCaseDetailPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Add `/projects/[id]/payouts` as the project-private payout console.
- [ ] Keep all reads and writes permission-aware and scoped by `project_id`.
- [ ] Support multiple viewing levels:
  - summary only
  - claim list without member detail
  - member-level payout detail
  - limited action-enabled payout workspace
- [ ] Make the project console useful but clearly more bounded than the internal operator workspace.
- [ ] Keep the UI explainable and project-safe rather than exposing raw internal payout systems by default.

## Task 5: Add owner-managed payout permissions

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\payout-permissions\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\ProjectPayoutPermissionsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\payouts\page.tsx`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Let project owners assign payout access to teammates using explicit `visibility` and `action` permissions.
- [ ] Keep `summary-only` as the default for project teams.
- [ ] Provide clear presets such as `Summary Viewer`, `Claim Reviewer`, and `Project Payout Lead`, but store them as explicit permission toggles.
- [ ] Show who currently has payout access and what they can actually do.
- [ ] Audit every permission change.

## Task 6: Add escalation and resolution rails end-to-end

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\payout\payout-actions.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\payout\cases\[caseId]\actions\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\payout-cases\[caseId]\actions\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\PayoutCaseDetailPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\payout\ProjectPayoutCaseDetailPanel.tsx`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Support internal-to-project escalation for `needs_project_input` workflows.
- [ ] Support project-to-internal escalation when the project lacks authority or raw payout detail visibility.
- [ ] Keep the case timeline intact across escalations instead of fragmenting the payout investigation.
- [ ] Make resolution states explicit: `resolved`, `dismissed`, `retry_queued`, `blocked`, `needs_project_input`.
- [ ] Ensure every payout case action writes both timeline events and audit records.

## Task 7: Final verification, rollout, and acceptance

**Files:**
- Review all changed payout, claims, rewards, portal, runtime, and migration files
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Run the final portal and runtime verification commands.
- [ ] Explicitly call out `veltrix_permissioned_payout_console.sql` as a required manual Supabase step before rollout.
- [ ] If runtime payout-case ingestion changed, explicitly call out `veltrix-community-bot` redeploy or payout-job redeploy requirements as part of rollout.
- [ ] Verify live acceptance on:
  - internal claims payout queue
  - internal payout case detail
  - `/projects/<id>/payouts`
  - owner-managed payout permissions
  - project-visible payout case detail and escalation

---

## Completion Criteria

This tranche is complete when:

- internal operators can work payout cases from a clear queue and detail workflow
- project owners can explicitly grant payout visibility and action scopes
- project teams only see what they were allowed to see
- project teams only do what they were allowed to do
- payout cases, escalations, retries, and resolutions are auditable and explainable
- the product payout layer feels deliberate instead of improvised
