# Permissioned On-chain Console Design

Date: 2026-04-21
Phase: 6
Track: Trust, rewards, payouts, and on-chain excellence
Status: Drafted for review

## Intent

Veltrix already has on-chain ingestion, retry, enrichment, wallet linking, tracked assets, and project-level on-chain configuration. What is still missing is a true product layer for observing failures, resolving anomalies, and letting projects participate safely without exposing raw operator controls.

This tranche turns on-chain from a sync-and-job surface into a permissioned resolution console that follows the same product language already established by:

- the permissioned trust console
- the permissioned payout console
- the platform hardening audit, incident, and override rails

The design goal is:

- internal operators keep full control over raw pipelines and global jobs
- projects get a bounded on-chain console for their own community and assets
- owners explicitly decide what teammates can see and what they can do
- project-side actions remain project-safe only
- every important on-chain action becomes explainable, auditable, and case-driven

## Product Promise

After this tranche:

- internal ops can triage failed ingress, enrichment failures, suspicious asset activity, unlinked wallet activity, and provider issues from one workspace
- projects can see the on-chain health of their own wallets, tracked assets, and unresolved cases
- project owners can grant bounded on-chain visibility and project-safe action rights
- retries, rescans, reruns, escalations, and resolutions are tracked through explicit case timelines
- raw global provider jobs stay internal-only

## Surface Model

The tranche introduces two aligned surfaces.

### 1. Internal On-chain Ops

This is the full-control operator workspace for all on-chain failures and anomalies.

It should support these work modes:

- `Queue`
- `Failures`
- `Signals`
- `Resolution Log`

`Queue` holds open and unresolved on-chain cases across the network.

`Failures` focuses on ingress rejects, retry failures, enrichment failures, and provider sync failures.

`Signals` focuses on suspicious on-chain patterns, unlinked wallet activity, unmatched project assets, and trust-adjacent anomalies.

`Resolution Log` shows resolved, dismissed, and successfully recovered cases with the full event timeline.

Internal operators always see:

- full case detail
- raw payload context
- retry and job history
- resolution timeline
- global operator actions

### 2. Project On-chain Console

This remains project-private and lives at:

- `/projects/[id]/onchain`

The current project page becomes a real bounded console instead of a simple sync/config rail.

It should support these work modes:

- `Health`
- `Cases`
- `Signals`
- `History`

`Health` shows:

- registered wallets
- tracked assets
- active incidents
- unresolved on-chain cases
- recent sync, retry, and enrichment posture
- project-safe action rail

`Cases` shows project-visible on-chain cases in a queue/detail/timeline pattern.

`Signals` shows project-visible anomalous activity such as unmatched tracked assets, unlinked wallet activity, and suspicious project-level patterns, shaped by permission level.

`History` shows project-visible resolution history, completed retries, dismissed cases, and recovered anomalies.

Projects never receive internal-only raw pipeline controls.

## Permission Model

The on-chain console uses the same two-axis permission model as trust and payouts.

Owners control:

- what a teammate may see
- what a teammate may do

Default project posture:

- `summary-only`
- no project actions enabled

### Visibility permissions

- `onchain_summary`
- `case_list`
- `member_wallet_detail`
- `event_detail`
- `raw_signal_detail`
- `resolution_history`

### Action permissions

- `annotate_case`
- `escalate_case`
- `retry_project_case`
- `rerun_project_enrichment`
- `rescan_project_assets`
- `resolve_project_blocker`

### Important safety rule

Project-side grants may only unlock project-safe actions.

Project users must never receive rights for:

- global provider sync jobs
- global retry sweeps
- internal-only pipeline maintenance actions
- network-wide raw operator workflows

Internal operators retain full access regardless of project grants.

## Case Model

The core product layer is a new explicit on-chain case system.

### New tables

- `onchain_cases`
- `onchain_case_events`
- `project_onchain_permissions`

This mirrors the trust and payout console structure so Veltrix keeps one consistent safety architecture.

### onchain_cases

Each case represents one resolvable on-chain problem or anomaly.

Suggested fields:

- `id`
- `project_id`
- `auth_user_id` nullable
- `wallet_address` nullable
- `asset_id` nullable
- `source_type`
- `source_id`
- `case_type`
- `severity`
- `status`
- `escalation_state`
- `summary`
- `evidence_summary`
- `raw_payload`
- `metadata`
- `internal_owner_auth_user_id`
- `project_owner_auth_user_id`
- `opened_at`
- `resolved_at`
- `dismissed_at`
- `created_at`
- `updated_at`

### Initial case types

- `ingress_rejected`
- `ingress_retry_failed`
- `enrichment_failed`
- `provider_sync_failure`
- `unmatched_project_asset`
- `unlinked_wallet_activity`
- `suspicious_onchain_pattern`
- `manual_onchain_review`

### Status lifecycle

- `open`
- `triaging`
- `needs_project_input`
- `blocked`
- `retry_queued`
- `resolved`
- `dismissed`

### Escalation lifecycle

- `none`
- `awaiting_internal`
- `awaiting_project`
- `escalated`

### onchain_case_events

Every meaningful action on a case should create a timeline event.

Initial event set:

- `case_opened`
- `annotated`
- `retry_queued`
- `retry_completed`
- `retry_failed`
- `project_input_requested`
- `asset_rescan_queued`
- `enrichment_rerun_queued`
- `escalated`
- `resolved`
- `dismissed`
- `permission_updated`

## Data Sources And Generation

The new case layer sits above existing on-chain and ops rails instead of replacing them.

Cases should be generated from:

- rejected ingress attempts already written into audit rails
- retry failures
- enrichment failures
- provider sync failures
- unmatched tracked project assets
- unlinked wallet activity
- suspicious on-chain trust-adjacent patterns
- manual operator review

Existing sources remain authoritative input:

- `onchain_events`
- admin audit logs
- project operation incidents and audits
- tracked assets
- wallet links
- existing trust-related suspicious signal generation

The new case model becomes the product-facing resolution layer above them.

## Workflows

### Internal workflows

Internal ops can:

- open and review cases
- annotate a case
- queue retries
- request project input
- rerun enrichment
- rescan assets
- resolve or dismiss a case
- inspect full payload and historical context

### Project workflows

Project users can only do what owners explicitly allow.

Possible bounded workflows:

- view health summary
- open visible cases
- annotate a case
- escalate a case to internal ops
- retry a project-safe case
- rerun project enrichment
- rescan project assets
- resolve a project blocker

### Queue/detail/timeline pattern

Both internal and project surfaces should follow one stable interaction model:

- left or top queue
- focused case detail
- timeline rail
- actions rail

This keeps the safety consoles visually and conceptually aligned across Veltrix.

## UI Direction

The on-chain console should feel like an operator product, not a blockchain explorer.

That means:

- health and risk posture first
- cases and resolution second
- raw details available but not visually dominant
- action rails clearly marked as project-safe or internal-only
- consistent pills, incident language, and timelines with trust and payout surfaces

The project console should feel bounded and understandable for project owners without exposing unnecessary low-level chain complexity.

## v1 Scope

This first on-chain tranche includes:

- schema foundation for on-chain cases, case events, and project permissions
- case generation from existing failure and anomaly rails
- upgraded internal on-chain ops workspace
- upgraded project-private on-chain console
- owner-managed visibility and action grants
- project-safe on-chain actions
- case timelines and audit writes

This v1 explicitly does not include:

- a full raw blockchain explorer
- chain trace debugging tools
- advanced anomaly lab tooling
- cross-project treasury analytics
- network-wide raw job controls for project users

## Success Criteria

This tranche is successful when:

- internal operators can handle on-chain failures through explicit cases instead of scattered logs
- projects can see their own bounded on-chain health and active issues
- owners can decide exactly what teammates may see and do
- project users can only run project-safe actions
- retries, rescans, reruns, escalations, and resolutions all leave explainable timelines
- on-chain joins trust and payouts under one shared safety architecture

## Risks And Guardrails

### Risk: exposing too much raw chain detail

Guardrail:

- raw event and signal detail remains permissioned
- default visibility is summary-only

### Risk: projects triggering unsafe jobs

Guardrail:

- project grants are restricted to project-safe actions only
- global provider and pipeline jobs remain internal-only

### Risk: duplicating trust and payout logic inconsistently

Guardrail:

- reuse the same case, timeline, permissions, and escalation vocabulary
- align UI and lifecycle patterns with the other safety consoles

### Risk: turning the console into a technical explorer

Guardrail:

- keep health, incidents, and cases primary
- raw payloads stay secondary and detail-only

## Rollout Notes

This tranche should be implemented inline with the existing roadmap discipline:

- schema and contracts first
- case generation second
- internal workspace next
- project console after that
- permissions and action rails after that
- rollout verification last

This keeps the on-chain console aligned with the already delivered trust and payout safety layers.
