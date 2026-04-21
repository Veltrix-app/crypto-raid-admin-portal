# Permissioned Payout Console Design

**Date:** 2026-04-21  
**Roadmap Phase:** `Phase 6 - Trust, Rewards, Claims, and On-Chain Excellence`  
**Second Tranche:** `reward / claim / payout safety`  
**Primary Surfaces:** `admin-portal` claims workspace + project payout console

## Goal

Turn rewards, claims, payout incidents, and campaign finalization failures into a real **permissioned payout console** that serves both:

- internal Veltrix operators with full payout control
- project teams with project-private payout visibility and optional actions

This tranche should make claim handling and payout recovery feel deliberate, explainable, and auditable instead of spread across:

- claim rows
- reward distribution failures
- campaign finalization retries
- audit logs
- manual Slack or Discord knowledge

The new product promise becomes:

> Veltrix lets internal operators govern payout safety globally while letting each project owner decide exactly how much payout visibility and payout action power their own team receives.

## Product Positioning

This payout console is not:

- a simple claim-status table
- an internal-only back office with no project visibility
- a finance-grade treasury system

It is:

- an internal operator workspace for claims, payout failures, and recovery flows
- a project-private payout console with permissioned access
- an explainable case system for blocked claims, failed distributions, inventory pressure, and disputes
- a safety rail around sensitive reward and payout actions

The moat is not only that payouts happen.
The moat is that:

- payout issues are surfaced as explicit cases
- projects can see the right amount of payout posture
- owners can govern team access explicitly
- every retry, escalation, and resolution is explainable

## Core Shift

Today payout safety is spread across:

- `reward_claims`
- `reward_distributions`
- campaign finalization rails
- reward inventory state
- claim review actions
- audit history

The product can already process claims and retries, but it does not yet feel like a deliberate payout operating layer.

This tranche shifts payout operations from:

- loose queues
- hidden retry logic
- ad hoc incident handling

to:

- explicit payout cases
- explicit permissions
- explicit escalation ownership
- explicit resolution trails

## Primary Users

### 1. Internal Operators

Internal operators need:

- global claim and payout visibility
- member-level claim detail
- raw failure detail
- resolution authority
- retry authority
- reward freeze and payout override power

They remain the full-control layer.

### 2. Project Owners

Project owners need:

- project-private payout health
- blocked claim posture
- finalization failure visibility
- reward inventory pressure visibility
- permission controls for what their team may see and do

Owners should decide whether teammates only observe payout posture or also participate in payout operations.

### 3. Project Reviewers / Payout Leads

These users may receive permissioned access to:

- payout summaries
- claim lists
- member-level claim views
- limited actions such as annotate, escalate, retry project-safe flows, or resolve project blockers

They should never receive broad payout power by default.

## Access Model

This tranche uses a strict **default-deny, summary-first** posture for project teams.

### Default Rules

- internal Veltrix operators have full access
- project teams start as `summary-only`
- claim-level member detail is hidden unless the owner explicitly grants it
- payout failure detail is hidden unless the owner explicitly grants it
- payout actions are unavailable unless the owner explicitly grants them

### Permission Axes

Permissions are split into two independent groups.

#### A. Visibility Permissions

- `payout_summary`
- `claim_list`
- `member_claim_detail`
- `payout_failure_detail`
- `wallet_delivery_detail`
- `resolution_history`

#### B. Action Permissions

- `annotate_case`
- `escalate_case`
- `retry_project_flow`
- `resolve_project_blocker`
- `freeze_reward`
- `pause_claim_rail`
- `payout_override`

### Practical Rule

A project user may:

- see only what the owner explicitly enabled
- act only within the project and only within the exact payout action scopes the owner enabled

No project-granted permission should ever cross project boundaries.

## Surface Model

This tranche introduces two connected but clearly separated payout surfaces.

### A. Internal Payout Ops

This evolves the existing `Claims` workspace into a real payout operations console.

Primary concerns:

- blocked claims
- manual fulfillment queue
- delivery failures
- campaign finalization failures
- reward inventory pressure
- payout disputes
- escalations from project teams

This workspace should feel global, operator-grade, and recovery-oriented.

### B. Project Payout Console

Primary route:

- `/projects/[id]/payouts`

This surface is project-private and designed for owners plus permissioned project teammates.

It should contain:

- payout health overview
- blocked claim posture
- payout incident list
- reward inventory pressure
- escalation state
- permission management
- payout action history

It should not become a full internal payout console clone.

## Case Model

The central object in this tranche should be a **payout case**.

Each case should capture:

- `project_id`
- optional `campaign_id`
- optional `reward_id`
- optional `claim_id`
- optional `auth_user_id`
- optional wallet identity
- case type
- severity
- status
- source system
- summary
- evidence summary
- raw payload
- internal owner
- project owner
- resolution notes
- escalation state
- timestamps

### Supported Case Types

The initial case taxonomy should cover:

- `claim_review`
- `claim_blocked`
- `delivery_failure`
- `reward_inventory_risk`
- `campaign_finalization_failure`
- `payout_dispute`
- `manual_payout_review`

This is broad enough to organize current payout risk without becoming an unbounded financial system.

### Source Model

The source systems should remain explicit.

Initial source types:

- `reward_claim`
- `reward_distribution`
- `campaign_finalization`
- `reward_inventory`
- `manual`

Existing claims, distributions, and finalization records stay the source of truth for raw execution.
The payout-case layer becomes the product-facing operating layer above them.

### Status Flow

Payout cases should use an explicit status model:

- `open`
- `triaging`
- `needs_project_input`
- `blocked`
- `retry_queued`
- `resolved`
- `dismissed`

This status model must be visible internally and project-side where permissions allow.

### Escalation Model

Escalation should remain explicit:

- `none`
- `awaiting_internal`
- `awaiting_project`
- `escalated`

This lets everyone answer:

- who owns the next move
- whether the project is blocking payout resolution
- whether the internal team still needs to act

## Internal Operator Design

The internal `Claims` workspace should become a proper payout console with at least these sections:

- `Queue`
- `Incidents`
- `Disputes`
- `Resolution Log`

### Queue

The queue should group by:

- payout case type
- severity
- claim priority
- project
- unresolved duration

### Incident View

Internal operators need a detail experience that can show:

- claim summary
- payout or finalization failure context
- wallet or delivery detail
- related reward and campaign context
- prior actions and notes
- retry state and override state

### Internal Actions

Internal operators should be able to:

- annotate
- escalate
- request project input
- dismiss
- resolve
- queue retry
- freeze reward
- pause claim rail
- apply payout override

All of these actions must write audit logs.

## Project Payout Console Design

The project payout console should stay useful but bounded.

### Owner Layer

Owners should see:

- current payout health
- blocked claim count
- failed campaign payout count
- reward inventory pressure
- teammates with payout access

Owners should also be the only default role that can grant additional payout permissions.

### Team Layer

Project teammates should see only the layers they were granted.

Possible experiences:

- summary only
- claim list without member details
- member-level claim detail
- limited action-enabled payout workspace

### UI Posture

The project payout console should feel:

- project-private
- high-signal
- more bounded than internal claims ops
- safer and more explainable than a broad financial admin panel

## Permission Management Design

Owners need an explicit payout permission surface that is easy to reason about.

It should support:

- assigning payout roles or seats
- toggling visibility permissions
- toggling action permissions
- reviewing who currently has access
- seeing the audit trail of permission changes

### Recommended Default Presets

To reduce friction, the system should support presets such as:

- `Summary Viewer`
- `Claim Reviewer`
- `Project Payout Lead`

But these presets should expand into explicit permission toggles, not remain opaque labels.

## Explainability Rules

Payout handling must stay explainable.

This tranche should explicitly avoid:

- silent payout retries with no visible trail
- hidden claim suppression
- operator-only failure context when the project genuinely needs to act
- actions without timeline history

Every visible payout action should be traceable to:

- who did it
- when it happened
- why it happened
- which payout issue it was intended to resolve

## Data and Architecture Direction

This tranche should add a dedicated payout-case layer rather than relying only on claim rows and finalization logs.

Recommended direction:

- keep `reward_claims`, `reward_distributions`, reward inventory, and campaign finalization outputs as execution inputs
- add a normalized `payout_cases` table
- add `payout_case_events` for timeline and action history
- add `project_payout_permissions` for visibility and action grants

The payout console should read from these normalized objects while preserving links back to the underlying claim or payout execution records.

## Rollout Scope For This First Tranche

This first payout tranche should include:

- permissioned payout console design and routing
- payout case model
- payout case timeline / event model
- project payout permission model
- internal claims queue upgrade into payout ops
- project payout console
- escalation and resolution rails
- audit logging for payout actions

This first payout tranche should not yet include:

- full payout automation redesign
- dispute arbitration beyond basic operator workflow
- treasury-grade payout orchestration
- broader on-chain observability rework
- generalized finance dashboards

Those belong to later Phase 6 tranches.

## Success Criteria

This tranche succeeds when:

- internal operators can triage and resolve payout cases from a clear workspace
- project owners can decide exactly what their team may see and do
- project-private payout visibility feels useful without becoming dangerous
- payout actions are auditable and explainable
- claims and payout incidents feel like a deliberate product system instead of scattered operator work
