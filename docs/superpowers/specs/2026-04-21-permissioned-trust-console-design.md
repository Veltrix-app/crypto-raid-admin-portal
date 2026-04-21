# Permissioned Trust Console Design

**Date:** 2026-04-21  
**Roadmap Phase:** `Phase 6 - Trust, Rewards, Claims, and On-Chain Excellence`  
**First Tranche:** `trust / fraud review`  
**Primary Surfaces:** `admin-portal` internal moderation + project trust console

## Goal

Turn the current trust and review rails into a real **permissioned trust console** that serves both:

- internal Veltrix operators with full trust and fraud control
- project teams with project-private visibility and optional actions

This tranche should make trust operations feel intentional, explainable, and governable instead of scattered across moderation tables, audit logs, and loosely connected flags.

The core product promise becomes:

> Veltrix lets internal operators govern risk globally while letting each project owner decide how much trust visibility and trust action power their own team receives.

## Product Positioning

This trust console is not:

- a hidden internal-only moderation back office
- a black-box fraud scorer that silently punishes users
- a broad member CRM

It is:

- an internal operator workspace for trust, fraud, and suspicious behavior review
- a project-private trust console with permissioned access
- an explainable case system with visibility controls and action controls
- an audit-heavy safety rail around sensitive trust decisions

The moat is not only the scoring logic.
It is the combination of:

- explainable trust evidence
- project-private case handling
- owner-controlled permissions
- clear escalation and resolution flows

## Core Shift

Today the trust/fraud system is spread across:

- `trust_snapshots`
- `review_flags`
- moderation queue logic
- on-chain suspicious signals
- callback and pipeline failure rails

The system already catches signals, but it does not yet feel like a product-grade trust operating layer.

This tranche shifts trust from:

- raw alerts
- hidden heuristics
- internal-heavy review posture

to:

- explicit trust cases
- explicit permissions
- explicit escalation ownership
- explicit resolution trails

## Primary Users

### 1. Internal Operators

Internal operators need:

- global trust and fraud visibility
- member-level evidence
- raw signal detail
- resolution authority
- trust overrides
- escalation control

They remain the full-control layer.

### 2. Project Owners

Project owners need:

- project-private trust health
- flagged member posture
- trust case visibility
- permission controls for what their team may see and do

Owners should decide whether project members can only observe trust posture or also participate in trust operations.

### 3. Project Moderators / Captains / Trust Leads

These users may receive permissioned access to:

- trust summaries
- case lists
- member-level cases
- limited actions such as annotate, escalate, or resolve project-scoped issues

They should never receive broad powers by default.

## Access Model

This tranche uses a strict **default-deny, view-first** posture for project teams.

### Default Rules

- internal Veltrix operators have full access
- project teams start as `view-only`
- no member-level detail or raw-signal detail is exposed unless the owner explicitly allows it
- no trust action power is granted unless the owner explicitly allows it

### Permission Axes

Permissions are split into two independent groups:

#### A. Visibility Permissions

- `trust_summary`
- `trust_case_list`
- `member_case_detail`
- `raw_signal_detail`
- `wallet_detail`
- `resolution_history`

#### B. Action Permissions

- `annotate_case`
- `escalate_case`
- `request_project_input`
- `resolve_project_case`
- `mute_member`
- `freeze_reward_eligibility`
- `reward_trust_override`
- `trust_override`

### Practical Rule

A project user may:

- see only what the owner explicitly enabled
- act only within the project and only within the exact action scopes the owner enabled

No project-granted permission should ever cross project boundaries.

## Surface Model

This tranche introduces two connected but clearly separated surfaces.

### A. Internal Trust Ops

This expands the existing moderation layer into a real trust and fraud workspace.

Primary concerns:

- suspicious activity queue
- sybil suspicion
- referral abuse
- fake engagement
- wallet anomalies
- trust posture shifts
- reward trust issues
- escalations from project teams

This workspace should feel global, operator-grade, and decisive.

### B. Project Trust Console

Primary route:

- `/projects/[id]/trust`

This surface is project-private and designed for owners plus permissioned project teammates.

It should contain:

- trust health overview
- project-scoped flagged members
- trust case list
- escalation state
- permission management
- trust action history

It should not become a full internal moderation clone.

## Case Model

The central object in this tranche should be a **trust case**.

Each case should capture:

- `project_id`
- optional `auth_user_id`
- optional wallet identity
- case type
- severity
- status
- source system
- summary
- evidence summary
- raw signal payload
- internal owner
- project owner
- resolution notes
- escalation state
- timestamps

### Supported Case Types

The initial case taxonomy should cover:

- `sybil_suspicion`
- `referral_abuse`
- `fake_engagement`
- `wallet_anomaly`
- `trust_drop`
- `reward_trust_risk`
- `manual_review`

More types can come later, but this first set is enough to organize current signals into a consistent system.

### Status Flow

Trust cases should use an explicit status model:

- `open`
- `triaging`
- `needs_project_input`
- `escalated`
- `resolved`
- `dismissed`

This status model must be visible both internally and project-side where permissions allow.

## Internal Operator Design

The internal moderation workspace should become a proper trust console with at least these sections:

- `Queue`
- `Investigations`
- `Escalations`
- `Resolution Log`

### Queue

The queue should group by:

- severity
- case type
- project
- freshness
- unresolved duration

### Investigation View

Internal operators need a case-detail experience that can show:

- summary
- trust history
- raw suspicious signals
- wallet and provider context
- related rewards or campaign context
- prior actions and notes

### Internal Actions

Internal operators should be able to:

- annotate
- escalate
- dismiss
- resolve
- mute
- freeze reward eligibility
- apply trust override
- apply reward trust override

All of these actions must write audit logs.

## Project Trust Console Design

The project trust console should stay explainable and bounded.

### Owner Layer

Owners should see:

- current trust health
- number of open cases
- severity mix
- escalations waiting on project input
- team permission settings

Owners should also be the only default role that can grant additional trust permissions to the team.

### Team Layer

Project teammates should see only the layers they were granted.

Possible experiences:

- summary only
- case list without member details
- member-level case detail
- action-enabled trust workspace

### UI Posture

The project console should feel:

- project-private
- high-signal
- less global than internal moderation
- safer and more bounded than the internal workspace

## Permission Management Design

Owners need a trust permission surface that is explicit and non-accidental.

It should support:

- assigning trust roles or seats
- toggling visibility permissions
- toggling action permissions
- reviewing who currently has access
- seeing the audit trail of permission changes

### Recommended Default Presets

To reduce configuration friction, the system should support presets such as:

- `Summary Viewer`
- `Case Reviewer`
- `Project Trust Lead`

But these presets should expand into explicit permission toggles, not remain opaque role labels.

## Escalation Model

Trust operations should support two-way escalation.

### Internal -> Project

Internal operators can request project input when:

- campaign context matters
- member intent is unclear
- project-side moderation judgment is useful

### Project -> Internal

Project users with the right permission can escalate when:

- risk exceeds their authority
- raw signal access is needed
- trust override is needed
- a decision could affect broader platform integrity

Escalation should always preserve the case timeline.

## Explainability Rules

Trust must stay explainable.

This tranche should explicitly avoid:

- invisible black-box sanctions
- unexplained score drops
- actions without audit history
- silent case closure

Every visible trust action should be traceable to:

- who did it
- when it happened
- why it happened
- which evidence supported it

## Data and Architecture Direction

This tranche should add a dedicated trust-case layer rather than continuing to rely only on raw `review_flags`.

Recommended direction:

- keep `trust_snapshots` and `review_flags` as signal inputs
- add a normalized `trust_cases` table
- add `trust_case_events` for timeline and action history
- add `project_trust_permissions` for visibility/action grants
- add optional `trust_case_assignments` if queue ownership needs its own object

The trust console should read from these normalized objects while still preserving the raw-signal link back to the source data.

## Rollout Scope For This First Tranche

This first Phase 6 tranche should include:

- permissioned trust console design and routing
- trust case model
- trust case timeline / event model
- project trust permission model
- internal queue upgrade
- project trust console
- escalation and resolution rails
- audit logging for trust actions

This first tranche should not yet include:

- complex ML-like fraud scoring
- aggressive auto-blocking
- cross-project shared trust automation beyond current signals
- broader claims and payout safety changes
- broader on-chain observability rework

Those belong to later Phase 6 tranches.

## Success Criteria

This tranche succeeds when:

- internal operators can triage and resolve trust cases from a clear workspace
- project owners can decide exactly what their team may see and do
- project-private trust visibility feels useful without becoming dangerous
- trust actions are auditable and explainable
- the product feels more trustworthy to both internal operators and project teams
