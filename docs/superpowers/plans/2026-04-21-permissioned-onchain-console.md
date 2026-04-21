# Permissioned On-chain Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the third `Phase 6` tranche as a real permissioned on-chain console with explicit on-chain cases, project-scoped visibility and action permissions, internal operator workflows, and auditable retry, enrichment, escalation, and resolution rails.

**Architecture:** Keep the existing on-chain ingestion, retry, enrichment, wallet-link, tracked-asset, and suspicious-signal rails as execution inputs, but introduce a normalized on-chain case layer for product use. `admin-portal` will expose two aligned surfaces on top of that foundation: a full-control internal on-chain ops workspace and a project-private on-chain console. Sensitive actions must flow through explicit permissions, explicit case events, and explicit audit logging. Project-side actions remain project-safe only.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `admin-portal`, `veltrix-community-bot`, existing on-chain jobs and AESP rails, existing project-private auth helpers, Vercel, and Render.

---

## Scope Guardrails

This plan intentionally covers only the third `Phase 6` tranche:

- on-chain observability
- failed-event resolution
- internal operator on-chain workspace
- project-private on-chain console
- project on-chain permissions
- on-chain case, escalation, retry, and resolution rails

In scope:

- normalized on-chain cases
- on-chain case events and history
- owner-managed visibility and action permissions
- internal on-chain queue and failure workflow
- upgraded project-private on-chain console on `/projects/[id]/onchain`
- audit logging for on-chain actions
- project-safe retry, rescan, and rerun actions
- escalation and resolution state

Out of scope for this tranche:

- broader trust or payout redesign
- full blockchain explorer or trace debugger
- cross-project treasury analytics
- global provider job delegation to project teams
- advanced anomaly lab tooling

---

## File Structure

### Database

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_permissioned_onchain_console.sql`
  - add `onchain_cases`, `onchain_case_events`, and `project_onchain_permissions`

### Portal shared logic

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\onchain\onchain-config.ts`
  - shared types, labels, permission keys, case status helpers, and mode labels
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\onchain\project-onchain-auth.ts`
  - project-private on-chain visibility and action checks layered on top of existing project access
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\onchain\project-onchain-cases.ts`
  - project-scoped case loaders, detail shaping, health summaries, and permission-aware filtering
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\onchain\internal-onchain-cases.ts`
  - internal queue and case detail loaders
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\onchain\onchain-actions.ts`
  - annotate, escalate, dismiss, resolve, retry, rerun, and rescan helpers
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\onchain\onchain-permissions.ts`
  - owner-managed visibility and action grants

### Portal API routes

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\onchain\cases\route.ts`
  - internal on-chain queue read route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\onchain\cases\[caseId]\route.ts`
  - internal on-chain case detail route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\onchain\cases\[caseId]\events\route.ts`
  - internal on-chain case event timeline route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\onchain\cases\[caseId]\actions\route.ts`
  - internal on-chain case action route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\onchain-cases\route.ts`
  - project-private on-chain case list route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\onchain-cases\[caseId]\route.ts`
  - permission-aware project on-chain case detail route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\onchain-cases\[caseId]\actions\route.ts`
  - permission-aware project on-chain case action route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\onchain-permissions\route.ts`
  - owner-managed on-chain visibility and action permission route
- existing ops proxy routes remain for internal-only jobs:
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\ops\onchain-provider-sync\route.ts`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\ops\onchain-retry\route.ts`
  - `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\ops\onchain-enrichment\route.ts`

### Portal UI

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\onchain\page.tsx`
  - upgrade into the project-private on-chain console
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
  - add an internal on-chain ops entry or summary rail if needed
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx`
  - optionally surface trust-adjacent on-chain signal pressure
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\OnchainQueuePanel.tsx`
  - internal on-chain queue
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\OnchainCaseDetailPanel.tsx`
  - case detail, evidence summary, and actions
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\OnchainCaseTimeline.tsx`
  - event history and resolution log
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\OnchainHealthPanel.tsx`
  - on-chain health summary for internal and project views
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\ProjectOnchainPermissionsPanel.tsx`
  - owner-managed on-chain visibility and action grants
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\ProjectOnchainCasesPanel.tsx`
  - project case list and escalations
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\ProjectOnchainCaseDetailPanel.tsx`
  - permission-aware project on-chain case view

### Runtime and case shaping

- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\onchain\onchain-cases.ts`
  - shared on-chain case creation, update, resolution, and event helpers
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\aesp\onchain.ts`
  - upsert normalized on-chain cases and events from rejects, anomalies, and suspicious patterns
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\retry-onchain-ingress.ts`
  - write retry queue, success, and failure state through on-chain cases
- `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\enrich-onchain-events.ts`
  - write enrichment cases and events
- provider sync runtime entrypoints and webhook intake where needed

---

## Task 1: Add the on-chain case schema and permission foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_permissioned_onchain_console.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\onchain\onchain-config.ts`
- Test:
  - schema review
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Add `onchain_cases` with explicit `project_id`, optional `auth_user_id`, optional `wallet_address`, optional `asset_id`, case type, severity, status, source system, evidence summary, raw payload, and resolution metadata.
- [ ] Add `onchain_case_events` so every annotation, escalation, retry, enrichment rerun, asset rescan, dismissal, and resolution becomes a timeline event.
- [ ] Add `project_onchain_permissions` with separate `visibility_permissions` and `action_permissions` payloads plus actor attribution.
- [ ] Define shared on-chain enums and labels in `onchain-config.ts` for case types, statuses, visibility permissions, and action permissions.
- [ ] Keep the default project posture summary-first: project users get no extra on-chain capability until the owner grants it.

## Task 2: Normalize existing failures and signals into on-chain cases

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\onchain\onchain-cases.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\core\aesp\onchain.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\retry-onchain-ingress.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\services\veltrix-community-bot\src\jobs\enrich-onchain-events.ts`
- Test:
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Map existing rejected ingress attempts, retry failures, enrichment failures, unmatched project assets, unlinked wallet activity, and suspicious patterns into normalized case types such as `ingress_rejected`, `ingress_retry_failed`, `enrichment_failed`, `provider_sync_failure`, `unmatched_project_asset`, `unlinked_wallet_activity`, `suspicious_onchain_pattern`, and `manual_onchain_review`.
- [ ] Upsert on-chain cases instead of relying only on audit logs or raw events as the product-facing source.
- [ ] Write on-chain case timeline events whenever a case is opened, updated, escalated, retried, enriched, resolved, or auto-refreshed from new evidence.
- [ ] Preserve the raw evidence trail so internal operators can still inspect underlying wallet, asset, and payload context.
- [ ] Keep this tranche explainable: no silent chain suppression and no opaque case generation.

## Task 3: Build the internal on-chain workspace

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\onchain\internal-onchain-cases.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\onchain\cases\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\onchain\cases\[caseId]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\onchain\cases\[caseId]\events\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\onchain\cases\[caseId]\actions\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\OnchainQueuePanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\OnchainCaseDetailPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\OnchainCaseTimeline.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\OnchainHealthPanel.tsx`
- Modify existing internal ops entry surfaces as needed
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Build an internal on-chain ops workspace with `Queue`, `Failures`, `Signals`, and `Resolution Log` modes.
- [ ] Let internal operators inspect member-level wallet context, tracked asset context, raw signal detail, provider failure metadata, and retry history.
- [ ] Support internal actions such as annotate, escalate, queue retry, rerun enrichment, rescan assets, dismiss, and resolve.
- [ ] Keep the workspace case-driven instead of a loose mix of sync buttons and logs.
- [ ] Write every on-chain action into the case timeline and broader audit rails.

## Task 4: Upgrade the project-private on-chain console

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\onchain\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\onchain\project-onchain-auth.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\onchain\project-onchain-cases.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\onchain-cases\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\onchain-cases\[caseId]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\ProjectOnchainCasesPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\ProjectOnchainCaseDetailPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts` if copy or entry labels need refinement
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Turn `/projects/[id]/onchain` into a real project-private console with `Health`, `Cases`, `Signals`, and `History` modes.
- [ ] Keep all reads and writes permission-aware and scoped by `project_id`.
- [ ] Support multiple viewing levels:
  - summary only
  - case list without wallet detail
  - member wallet and event detail
  - limited action-enabled on-chain workspace
- [ ] Make the project console useful but clearly more bounded than the internal operator workspace.
- [ ] Keep the UI understandable for project owners instead of exposing raw chain complexity by default.

## Task 5: Add owner-managed on-chain permissions

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\onchain-permissions\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\ProjectOnchainPermissionsPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\onchain\page.tsx`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Let project owners assign on-chain access to teammates using explicit `visibility` and `action` permissions.
- [ ] Keep `summary-only` as the default for project teams.
- [ ] Provide clear presets such as `Summary Viewer`, `Case Reviewer`, and `Project On-chain Lead`, but store them as explicit permission toggles.
- [ ] Show who currently has on-chain access and what they can actually do.
- [ ] Audit every permission change.

## Task 6: Add project-safe action rails, escalation, and resolution end-to-end

**Files:**
- Create or modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\onchain\onchain-actions.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\onchain\cases\[caseId]\actions\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\projects\[id]\onchain-cases\[caseId]\actions\route.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\OnchainCaseDetailPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\onchain\ProjectOnchainCaseDetailPanel.tsx`
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`

- [ ] Support internal-to-project escalation for `needs_project_input` workflows.
- [ ] Support project-to-internal escalation when the project lacks authority or raw on-chain detail visibility.
- [ ] Expose only project-safe actions to granted project users:
  - retry project case
  - rerun project enrichment
  - rescan project assets
  - annotate
  - escalate
  - resolve project blocker
- [ ] Keep the case timeline intact across escalations instead of fragmenting the resolution history.
- [ ] Ensure every on-chain case action writes both timeline events and audit records.

## Task 7: Final verification, rollout, and acceptance

**Files:**
- Review all changed on-chain, portal, runtime, and migration files
- Test:
  - `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run typecheck --workspace veltrix-community-bot`
  - `npm run build --workspace veltrix-community-bot`

- [ ] Run the final portal and runtime verification commands.
- [ ] Explicitly call out `veltrix_permissioned_onchain_console.sql` as a required manual Supabase step before rollout.
- [ ] Explicitly call out `veltrix-community-bot` redeploy if runtime on-chain case ingestion or action endpoints changed.
- [ ] Verify live acceptance on:
  - internal on-chain queue
  - internal on-chain case detail
  - `/projects/<id>/onchain`
  - owner-managed on-chain permissions
  - project-visible on-chain case detail and escalation
  - project-safe retry, enrichment rerun, and asset rescan flows

---

## Completion Criteria

This tranche is complete when:

- internal operators can work on-chain failures and anomalies from a clear queue and detail workflow
- project owners can explicitly grant on-chain visibility and action scopes
- project teams only see what they were allowed to see
- project teams only do project-safe actions they were allowed to do
- on-chain cases, retries, reruns, rescans, escalations, and resolutions are auditable and explainable
- the product on-chain layer feels aligned with trust and payouts instead of improvised
