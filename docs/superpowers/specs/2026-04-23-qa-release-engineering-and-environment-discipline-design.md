# QA, Release Engineering, And Environment Discipline Design

Date: 2026-04-23
Status: Approved design
Scope: Whole-stack release substrate for QA, environment audits, migration discipline, smoke verification, and launch-safe release control

## 1. Goal

Build the first complete Veltrix release machine so launch readiness no longer depends on memory, ad hoc terminal commands, or scattered chat instructions.

Phase 15 should make it possible to answer all of the following from one connected operating layer:

- what is in the current release candidate
- which repos and services are affected
- whether the critical build and type gates passed
- whether the target environment is configured correctly
- which database migration is attached to the release
- which smoke checks must run before launch
- whether the release is safe to ship
- what the rollback or mitigation posture is if something breaks

## 2. Product Posture

Veltrix already has:

- product surfaces across `veltrix-web`, `admin-portal`, `veltrix-docs`, and `veltrix-community-bot`
- strong internal operations layers for billing, support, success, analytics, and security
- a growing set of rollout notes and smoke instructions
- build and typecheck commands for key services

What is still missing is one release truth that connects:

- release scope
- critical build gates
- migration discipline
- environment audit posture
- smoke verification
- go/no-go decision making
- rollback notes

Phase 15 should not become a generic DevOps dashboard.

It should become a launch-safe release substrate for the Veltrix stack.

## 3. Scope

### 3.1 In Scope

- internal release workspace
- internal QA workspace
- release candidate records
- service-by-service release scope
- release checks and gate tracking
- environment audits
- migration-to-release linkage
- smoke verification packs
- explicit go/no-go states
- rollback posture capture
- hard release gates for:
  - `veltrix-web`
  - `admin-portal`
  - database migrations
- release-machine inclusion for:
  - `veltrix-web`
  - `admin-portal`
  - `veltrix-docs`
  - `veltrix-community-bot`

### 3.2 Out Of Scope

- a full CI vendor migration
- a complete deployment orchestrator replacement
- automatic infra provisioning
- deep synthetic monitoring across all routes
- full test automation for every surface in one pass
- replacing existing provider dashboards such as Vercel, Supabase, or Stripe

## 4. Recommended Approach

### Option A: Manual release machine only

Rely on strong checklists, smoke notes, and operator discipline without hard technical gates.

Pros:

- fast to start
- low implementation complexity

Cons:

- still fragile at launch time
- too dependent on humans remembering to run the right checks

### Option B: Full hard-blocking CI everywhere

Make every service and surface PR-blocking and release-blocking immediately.

Pros:

- strongest theoretical safety
- maximum consistency

Cons:

- too heavy for current stack maturity
- likely to slow down shipping without proportional short-term value

### Option C: Hybrid release model

Use hard blocking gates for the most production-sensitive release surfaces while building a broader release and QA machine for the whole stack.

Pros:

- strongest practical balance
- protects the most critical paths first
- still gives whole-stack release visibility
- launch-ready without overbuilding

Cons:

- some services remain lighter-gated in v1

### Recommendation

Build `Option C`.

Phase 15 should be a hybrid release model:

- **hard CI-style gates** for:
  - `veltrix-web`
  - `admin-portal`
  - database migrations
- **release control discipline** for the whole stack:
  - `veltrix-web`
  - `admin-portal`
  - `veltrix-docs`
  - `veltrix-community-bot`
  - environment posture across Vercel, Supabase, Stripe, and related configs

## 5. Release System Model

Phase 15 should be structured as three connected truths.

### 5.1 Build And Gate Truth

Track whether the release candidate is technically safe to move forward:

- build status
- typecheck status
- critical test status
- migration sanity
- required environment presence
- critical blockers

This truth must be hard-blocking for:

- `veltrix-web`
- `admin-portal`
- database migrations

### 5.2 Release Control Truth

Track what is actually being shipped:

- release summary
- affected services
- release owner
- target environment
- linked migrations
- deploy sequence
- rollback and mitigation notes
- current release state

### 5.3 Verification Truth

Track whether live behavior was actually verified:

- smoke categories
- route checks
- critical flow checks
- environment audit results
- service-level verification notes
- verified / degraded / failed outcome

## 6. Gates, Checklists, And States

### 6.1 Hard Gates

Blocking gates in v1:

- build must pass
- typecheck must pass
- critical tests must pass
- required env vars must exist for target environment
- migration must be reviewed and linked if applicable
- no unresolved `P0` launch blocker

### 6.2 Checklist Blocks

Each release should be tracked through six checklist blocks:

- `Scope`
- `Environment`
- `Database`
- `Deploy`
- `Smoke`
- `Rollback`

### 6.3 Release States

Release states should be:

- `draft`
- `ready_for_review`
- `approved`
- `deploying`
- `smoke_pending`
- `verified`
- `degraded`
- `rolled_back`

### 6.4 Blocker Labels

Use:

- `P0 launch blocker`
- `P1 must-fix soon`
- `P2 watch`
- `P3 note`

Go/no-go rule:

- `P0` means no go
- `P1` requires explicit acceptance
- `P2` and `P3` can ship when documented

### 6.5 Smoke Categories

Smoke packs should be grouped as:

- `auth_and_entry`
- `billing_and_account`
- `support_and_status`
- `security_and_trust`
- `success_and_analytics`
- `docs_and_public_surfaces`
- `community_bot_readiness`

## 7. Surface And Route Model

### 7.1 Internal Release Workspace

Routes:

- `/releases`
- `/releases/[id]`

`/releases` should show:

- current release candidate
- recent releases
- service scope
- blockers
- gate summaries
- environment posture
- smoke progress

`/releases/[id]` should show:

- release scope
- affected services
- linked migrations
- environment audit
- gate and checklist state
- smoke results
- rollback notes
- release timeline

### 7.2 Internal QA Workspace

Routes:

- `/qa`
- optional `/qa/runs/[id]` later

`/qa` should show:

- current smoke packs
- failing critical checks
- route verification summaries
- environment warnings
- readiness by surface

### 7.3 Existing Operations Surfaces

Phase 15 should feed existing internal surfaces where useful:

- `Business`
- `Support`
- `Security`
- `Success`
- `Analytics`

Release posture should not live as an isolated island when those surfaces are directly affected by shipped changes.

## 8. Data Model

Phase 15 should introduce the following core entities.

### 8.1 Release Records

- `release_runs`
- `release_run_services`

These entities should store:

- release identity
- owner
- target environment
- summary
- state
- affected services
- service-level status

### 8.2 Release Checks

- `release_run_checks`

These entities should store:

- gate type
- result
- severity
- notes
- timestamps
- whether the check is blocking

### 8.3 Smoke Results

- `release_run_smoke_results`

These entities should store:

- smoke category
- scenario label
- result
- notes
- verified by
- verified at

### 8.4 Environment Audits

- `environment_audits`

These entities should store:

- target service
- environment
- required variable posture
- missing or mismatched values
- summary state
- verified timestamp

### 8.5 Migration Linkage

- `migration_release_links`

These entities should store:

- migration filename
- linked release
- review state
- run state
- mitigation or rollback notes

## 9. Stack Model

Phase 15 should treat the stack explicitly as:

- `webapp`
- `portal`
- `docs`
- `community_bot`

### 9.1 Hard-gated in v1

- `webapp`
- `portal`
- database migrations

### 9.2 Release-included but lighter-gated in v1

- `docs`
- `community_bot`

This means they still appear in release scope, environment posture, and smoke verification, but do not need identical gate depth in the first launch-hardening pass.

## 10. Ownership Model

### 10.1 `admin-portal`

Owns:

- `/releases`
- `/releases/[id]`
- `/qa`
- internal release and verification UI
- release and QA read models

### 10.2 Shared Postgres

Owns:

- release truth
- check truth
- smoke truth
- environment audit truth
- migration linkage truth

### 10.3 Existing Services

Continue to own their build and runtime commands:

- `veltrix-web`
- `admin-portal`
- `veltrix-docs`
- `veltrix-community-bot`

Phase 15 should orchestrate and record their readiness, not replace their entire local build systems.

## 11. Build Order

### 11.1 Release Foundation

- SQL migration
- entity and contract layer
- release states
- service keys
- check categories
- smoke categories

### 11.2 Environment Audit Layer

- env contract definitions
- required env checks per surface
- audit summary logic
- missing or mismatch warnings

### 11.3 Internal Release Workspace

- `/releases`
- `/releases/[id]`
- release scope
- service status
- gate panels
- migration linkage
- rollback notes

### 11.4 Internal QA Workspace

- `/qa`
- smoke category view
- failing checks
- verification summaries
- readiness by surface

### 11.5 Smoke And Verification Packs

- auth and entry
- billing and account
- support and status
- security and trust
- success and analytics
- docs and public surfaces
- community bot readiness

### 11.6 Hard Gates

- blocking release checks for:
  - `veltrix-web`
  - `admin-portal`
  - migrations
- lighter but visible checks for:
  - `docs`
  - `community_bot`

### 11.7 Rollout And Acceptance

- create release candidate
- attach migration
- verify environments
- deploy services
- run smoke packs
- resolve or accept blockers
- record go/no-go
- record rollback posture

## 12. Risks And Mitigations

### 12.1 Overbuilding DevOps Before Launch

Risk:

- the release system turns into a platform project that delays launch

Mitigation:

- keep v1 focused on release truth, gates, audits, and smoke verification
- do not replace provider dashboards or build systems

### 12.2 Under-gating Critical Paths

Risk:

- launch still depends on memory or optimistic manual checks

Mitigation:

- hard-gate `webapp`, `portal`, and migrations first
- make release state and smoke verification explicit

### 12.3 Whole-stack Ambiguity

Risk:

- `docs` and `community_bot` keep getting forgotten because they are not always front-of-mind

Mitigation:

- include them in every release candidate model
- include env and smoke posture even when the gate depth is lighter

## 13. Definition Of Done

Phase 15 is only complete when:

- Veltrix has an internal release workspace
- Veltrix has an internal QA workspace
- release candidates have explicit states
- `webapp`, `portal`, and migrations are hard-gated
- `docs` and `community_bot` are included in release scope and verification
- migrations are linked to releases
- environment posture is visible and reviewable
- smoke checks are structured and recorded
- go/no-go is based on explicit release truth instead of chat memory
- rollback posture exists for launch-sensitive releases
