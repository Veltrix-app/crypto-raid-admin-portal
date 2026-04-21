# Permissioned Trust Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first `Phase 6` tranche as a real permissioned trust console with explicit trust cases, project-scoped visibility and action permissions, internal operator workflows, and auditable escalation and resolution rails.

**Architecture:** Keep the existing trust and fraud signal sources (`trust_snapshots`, `review_flags`, on-chain suspicious signals) as inputs, but introduce a normalized trust-case layer for product use. `admin-portal` will expose two surfaces on top of that foundation: a full-control internal trust workspace and a project-private trust console. Every sensitive action must flow through explicit permissions, explicit case events, and explicit audit logging.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `admin-portal`, `veltrix-community-bot`, existing moderation and trust rails, existing project-private auth helpers, Vercel, and Render.

---

## Scope Guardrails

This plan intentionally covers only the first `Phase 6` tranche:

- trust / fraud review
- internal operator trust workspace
- project-private trust console
- project trust permissions
- trust case, escalation, and resolution rails

In scope:

- normalized trust cases
- trust case events and history
- owner-managed visibility and action permissions
- internal trust queue and case detail workflow
- project-private trust console on `/projects/[id]/trust`
- audit logging for trust actions
- escalation and resolution state

Out of scope for this tranche:

- reward inventory, stock, dispute, and payout safety rework
- claim processing redesign
- full on-chain observability overhaul
- aggressive auto-blocking or black-box fraud automation
- cross-project project-owner moderation tools

---

## File Structure

### Database

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_permissioned_trust_console.sql`
  - add `trust_cases`, `trust_case_events`, and `project_trust_permissions`

### Portal shared logic

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\trust\trust-config.ts`
  - shared types, labels, permission keys, and case status helpers
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\trust\project-trust-auth.ts`
  - project-private trust visibility/action checks layered on top of existing project access
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\trust\project-trust-cases.ts`
  - project-scoped case loaders, detail shaping, and permission-aware filtering
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\trust\internal-trust-cases.ts`
  - internal queue and case detail loaders
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\trust\trust-actions.ts`
  - annotate, escalate, dismiss, resolve, and override-safe action helpers

### Portal API routes

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\trust\cases\route.ts`
  - internal trust queue read route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\trust\cases\[caseId]\route.ts`
  - internal trust case detail route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\trust\cases\[caseId]\events\route.ts`
  - internal trust case event timeline route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\trust\cases\[caseId]\actions\route.ts`
  - internal trust case action route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\trust-cases\route.ts`
  - project-private trust case list route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\trust-cases\[caseId]\route.ts`
  - permission-aware project trust case detail route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\trust-cases\[caseId]\actions\route.ts`
  - permission-aware project trust action route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\trust-permissions\route.ts`
  - owner-managed visibility and action permission route

### Portal UI

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx`
  - turn moderation into the internal trust console entry surface
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\trust\page.tsx`
  - new project-private trust console
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\TrustQueuePanel.tsx`
  - internal trust queue
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\TrustCaseDetailPanel.tsx`
  - case detail, evidence summary, and actions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\TrustCaseTimeline.tsx`
  - event history and resolution log
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\TrustHealthPanel.tsx`
  - health summary for internal and project views
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\ProjectTrustPermissionsPanel.tsx`
  - owner-managed trust visibility and action grants
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\ProjectTrustCasesPanel.tsx`
  - project case list and escalations
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\ProjectTrustCaseDetailPanel.tsx`
  - permission-aware project case view

### Runtime and signal shaping

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\aesp\trust.ts`
  - map suspicious signals more cleanly into case types and evidence payloads
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\aesp\onchain.ts`
  - upsert normalized trust cases and trust case events from suspicious signals
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\trust\trust-cases.ts`
  - shared trust case creation/update/event helpers
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\platform\operation-events.ts`
  - ensure trust actions write audit records where needed

---

## Task 1: Add the trust-case schema and permission foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_permissioned_trust_console.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\trust\trust-config.ts`
- Test:
  - schema review
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Add `trust_cases` with explicit `project_id`, optional `auth_user_id`, case type, severity, status, source system, evidence summary, raw signal payload, and resolution metadata.
- [ ] Add `trust_case_events` so every annotation, escalation, dismissal, resolution, and override becomes a timeline event.
- [ ] Add `project_trust_permissions` with separate `visibility_permissions` and `action_permissions` payloads plus actor attribution.
- [ ] Define shared trust enums and labels in `trust-config.ts` for case types, statuses, visibility permissions, and action permissions.
- [ ] Keep the default project posture view-first: project users get no extra trust capability until the owner grants it.

## Task 2: Normalize signal ingestion into trust cases

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\trust\trust-cases.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\aesp\trust.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\aesp\onchain.ts`
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Map existing suspicious flags and trust posture changes into normalized case types such as `sybil_suspicion`, `referral_abuse`, `fake_engagement`, `wallet_anomaly`, `trust_drop`, and `reward_trust_risk`.
- [ ] Upsert trust cases instead of relying only on raw `review_flags` as the product-facing source.
- [ ] Write trust case timeline events whenever a case is opened, updated, escalated, or auto-refreshed from new evidence.
- [ ] Preserve the raw evidence trail so internal operators can still inspect underlying suspicious signals.
- [ ] Keep this tranche explainable: no silent sanctions and no opaque case generation.

## Task 3: Build the internal trust workspace

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\trust\internal-trust-cases.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\trust\cases\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\trust\cases\[caseId]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\trust\cases\[caseId]\events\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\trust\cases\[caseId]\actions\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\TrustQueuePanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\TrustCaseDetailPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\TrustCaseTimeline.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\TrustHealthPanel.tsx`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Turn moderation into a proper internal trust console with `Queue`, `Investigations`, `Escalations`, and `Resolution Log` modes.
- [ ] Let internal operators inspect member-level evidence, raw signal detail, wallet/provider context, and related project context.
- [ ] Support internal actions such as annotate, escalate, dismiss, resolve, mute, freeze reward eligibility, and trust override.
- [ ] Keep the workspace high-signal and case-driven instead of a loose mix of tables.
- [ ] Write every trust action into the case timeline and the broader audit rails.

## Task 4: Build the project-private trust console

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\trust\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\trust\project-trust-auth.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\trust\project-trust-cases.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\trust-cases\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\trust-cases\[caseId]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\ProjectTrustCasesPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\ProjectTrustCaseDetailPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Add `/projects/[id]/trust` as the project-private trust console.
- [ ] Keep all reads and writes permission-aware and scoped by `project_id`.
- [ ] Support multiple viewing levels:
  - summary only
  - case list without member detail
  - member-level case detail
  - action-enabled trust workspace
- [ ] Make the project console useful but clearly more bounded than the internal operator workspace.
- [ ] Keep the UI explainable and project-safe rather than exposing raw internal systems by default.

## Task 5: Add owner-managed trust permissions

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\trust-permissions\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\ProjectTrustPermissionsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\trust\page.tsx`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Let project owners assign trust access to teammates using explicit `visibility` and `action` permissions.
- [ ] Keep `view-only` as the default for project teams.
- [ ] Provide clear presets such as `Summary Viewer`, `Case Reviewer`, and `Project Trust Lead`, but store them as explicit permission toggles.
- [ ] Show who currently has trust access and what they can actually do.
- [ ] Audit every permission change.

## Task 6: Add escalation and resolution rails end-to-end

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\trust\trust-actions.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\trust\cases\[caseId]\actions\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\trust-cases\[caseId]\actions\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\TrustCaseDetailPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\trust\ProjectTrustCaseDetailPanel.tsx`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Support internal-to-project escalation for `needs_project_input` workflows.
- [ ] Support project-to-internal escalation when the project lacks authority or evidence visibility.
- [ ] Keep the case timeline intact across escalations instead of fragmenting the investigation.
- [ ] Make resolution states explicit: `resolved`, `dismissed`, `escalated`, `needs_project_input`.
- [ ] Ensure every case action writes both timeline events and audit records.

## Task 7: Final verification, rollout, and acceptance

**Files:**
- Review all changed trust, moderation, portal, runtime, and migration files
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Run the final portal and runtime verification commands.
- [ ] Explicitly call out `veltrix_permissioned_trust_console.sql` as a required manual Supabase step before rollout.
- [ ] If runtime trust-case ingestion changed, explicitly call out `veltrix-community-bot` redeploy as part of rollout.
- [ ] Verify live acceptance on:
  - internal moderation trust queue
  - internal trust case detail
  - `/projects/<id>/trust`
  - owner-managed trust permissions
  - project-visible case detail and escalation

---

## Completion Criteria

This tranche is complete when:

- internal operators can work trust cases from a clear queue and detail workflow
- project owners can explicitly grant trust visibility and action scopes
- project teams only see what they were allowed to see
- project teams only do what they were allowed to do
- trust cases, escalations, and resolutions are auditable and explainable
- the product trust layer feels deliberate instead of improvised
