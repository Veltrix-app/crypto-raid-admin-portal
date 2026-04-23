# QA, Release Engineering, And Environment Discipline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first complete Veltrix release machine so the whole stack can be shipped with explicit gates, environment audits, linked migrations, recorded smoke verification, and a real go/no-go posture instead of ad hoc launch rituals.

**Architecture:** Keep Phase 15 as one shared release substrate with three internal views: `/releases`, `/releases/[id]`, and `/qa`. Store release runs, service scope, checks, smoke results, environment audits, and migration links in shared Postgres. `admin-portal` owns the release and QA workspaces plus the read models and internal operator actions. Existing apps and services keep their own build/runtime commands; Phase 15 records and evaluates readiness instead of replacing local toolchains. Hard gates apply to `veltrix-web`, `admin-portal`, and database migrations. `veltrix-docs` and `veltrix-community-bot` are included in release scope and verification with lighter-gated readiness in v1.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `admin-portal`, existing `veltrix-web` / `veltrix-docs` / `veltrix-community-bot` workspace scripts, Vercel, Supabase, Stripe-dependent env posture, existing support/security/business/success/analytics internal surfaces, and rollout notes in `docs/superpowers`.

---

## Scope framing

This is the concrete Phase 15 build tranche for:

- release candidates
- critical build and gate truth
- environment audit posture
- migration discipline
- smoke verification
- go/no-go and rollback capture

This plan intentionally combines:

- release control
- QA verification
- environment discipline

because launch safety depends on all three being tied to the same release object.

## Relationship to earlier planning

This document is the concrete execution plan for:

- `Phase 15: QA, Release Engineering, And Environment Discipline`

from:

- [2026-04-23-qa-release-engineering-and-environment-discipline-design.md](C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-qa-release-engineering-and-environment-discipline-design.md)

It should be executed after:

- Phase 10 billing and business control
- Phase 11 support and status operations
- Phase 12 customer success
- Phase 13 analytics
- Phase 14 security and trust center

so the release machine can verify the real launch-critical flows already built across the platform.

## Working assumptions

- Release control lives in `admin-portal`.
- Shared Postgres stores release truth and verification truth.
- `veltrix-web`, `admin-portal`, `veltrix-docs`, and `veltrix-community-bot` all appear in release scope.
- `webapp`, `portal`, and migrations are hard-gated in v1.
- `docs` and `community_bot` are included in release scope, environment audits, and smoke verification, but do not need identical gate depth in v1.
- Existing provider dashboards such as Vercel, Supabase, and Stripe remain the source of actual deploy execution state where appropriate.
- Phase 15 should improve operational clarity, not introduce a full CI vendor migration.

## Out of scope for this tranche

- replacing GitHub Actions, Vercel, or provider-native deployment systems
- full-stack synthetic monitoring
- full automated E2E coverage for every route
- automated infrastructure provisioning
- complete rollback automation
- heavy bot orchestration or multi-region release tooling

---

## Product contract for v1

### Internal release surfaces

- `/releases`
  - current release candidate
  - recent releases
  - service scope
  - gate summaries
  - environment posture
  - blockers
  - smoke progress
- `/releases/[id]`
  - release detail
  - affected services
  - linked migrations
  - checks
  - smoke results
  - rollback notes
  - timeline

### Internal QA surface

- `/qa`
  - smoke packs
  - failing critical checks
  - route verification summaries
  - environment warnings
  - readiness by surface

### Release states in v1

- `draft`
- `ready_for_review`
- `approved`
- `deploying`
- `smoke_pending`
- `verified`
- `degraded`
- `rolled_back`

### Service keys in v1

- `webapp`
- `portal`
- `docs`
- `community_bot`

### Check blocks in v1

- `Scope`
- `Environment`
- `Database`
- `Deploy`
- `Smoke`
- `Rollback`

### Smoke categories in v1

- `auth_and_entry`
- `billing_and_account`
- `support_and_status`
- `security_and_trust`
- `success_and_analytics`
- `docs_and_public_surfaces`
- `community_bot_readiness`

---

## File structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_qa_release_engineering_and_environment_discipline_v1.sql`
  - release runs, services, checks, smoke results, environment audits, and migration links

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\releases\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\releases\[id]\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\qa\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\releases\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\releases\[id]\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\releases\[id]\checks\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\releases\[id]\smoke\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\releases\[id]\environment-audits\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\qa\overview\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\ReleaseOverviewPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\ReleaseServicesPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\ReleaseChecksPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\ReleaseSmokePanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\EnvironmentAuditPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\ReleaseTimelinePanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\qa\QaReadinessBoard.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\release\release-contract.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\release\release-overview.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\release\release-actions.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\release\environment-audits.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\release\smoke-packs.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\release.ts`

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`

### New support docs and rollout notes

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-phase15-rollout-notes.md`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-release-language-and-go-no-go-posture.md`

---

## Task 1: Add release, QA, and environment schema foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_qa_release_engineering_and_environment_discipline_v1.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\release.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`

- [ ] Create `release_runs` with release state, owner, target environment, summary, blocker posture, and rollback notes.
- [ ] Create `release_run_services` with service key, inclusion status, deploy status, and notes.
- [ ] Create `release_run_checks` with block, result, severity, blocking flag, and verification notes.
- [ ] Create `release_run_smoke_results` with smoke category, scenario label, result, verifier, and timestamps.
- [ ] Create `environment_audits` with service key, environment, status, summary, missing vars, and mismatch notes.
- [ ] Create `migration_release_links` with migration filename, review state, run state, and mitigation notes.
- [ ] Add indexes for:
  - release state
  - environment audit status
  - blocking checks
  - smoke category/result
  - migration review and run state

## Task 2: Define release language, gate rules, and smoke pack contracts

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\release\release-contract.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\release\smoke-packs.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-release-language-and-go-no-go-posture.md`

- [ ] Define release states, service keys, check blocks, smoke categories, and blocker labels as shared contracts.
- [ ] Define the v1 hard-gate rule set for `webapp`, `portal`, and migrations.
- [ ] Define lighter-gated but required readiness rules for `docs` and `community_bot`.
- [ ] Define standard smoke scenarios per category:
  - auth and entry
  - billing and account
  - support and status
  - security and trust
  - success and analytics
  - docs and public surfaces
  - community bot readiness
- [ ] Define release-language guidance for:
  - `go`
  - `no-go`
  - `degraded`
  - `rolled_back`
  - `P0/P1/P2/P3`

## Task 3: Build the environment audit layer

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\release\environment-audits.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\releases\[id]\environment-audits\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\EnvironmentAuditPanel.tsx`

- [ ] Define required env posture for:
  - `veltrix-web`
  - `admin-portal`
  - `veltrix-docs`
  - `veltrix-community-bot`
- [ ] Include shared dependency posture for:
  - Supabase
  - Stripe
  - Vercel
- [ ] Build audit summary logic that can show:
  - ready
  - missing vars
  - suspicious mismatch
  - not reviewed
- [ ] Expose the audit data to release detail and QA overview surfaces.

## Task 4: Build the internal release workspace

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\releases\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\releases\[id]\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\releases\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\releases\[id]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\releases\[id]\checks\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\releases\[id]\smoke\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\ReleaseOverviewPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\ReleaseServicesPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\ReleaseChecksPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\ReleaseSmokePanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\ReleaseTimelinePanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\release\release-overview.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\release\release-actions.ts`

- [ ] Build `/releases` as the command surface for current and recent release candidates.
- [ ] Build `/releases/[id]` with:
  - scope
  - service inclusion
  - checks
  - environment audit
  - smoke results
  - rollback notes
  - timeline
- [ ] Make release records internal-only.
- [ ] Support structured operator actions:
  - create draft release
  - move release state
  - update checks
  - record smoke results
  - attach migration notes

## Task 5: Build the internal QA workspace

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\qa\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\qa\overview\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\qa\QaReadinessBoard.tsx`

- [ ] Build `/qa` as the verification truth surface.
- [ ] Show:
  - failing critical checks
  - incomplete smoke packs
  - environment warnings
  - readiness by surface
  - release candidates waiting on QA
- [ ] Keep the board action-oriented so it tells operators what still needs verification, not just what exists.

## Task 6: Connect release gating and migration discipline

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\releases\ReleaseChecksPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\release\release-overview.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\release\release-contract.ts`

- [ ] Encode hard gate semantics for:
  - `webapp`
  - `portal`
  - migrations
- [ ] Derive release-level `go/no-go` from blocking checks and `P0/P1` posture.
- [ ] Add migration linkage and review states so a release can show whether the DB step is:
  - not needed
  - linked but pending
  - reviewed
  - run
  - blocked
- [ ] Prevent a release from being marked `verified` while blocking checks still fail.

## Task 7: Add nav and ops integration

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- Modify any existing internal dashboards where a release summary link materially helps

- [ ] Add `Releases` and `QA` to internal portal navigation.
- [ ] Keep them visible only to internal Veltrix admins.
- [ ] Add lightweight cross-links from `Security`, `Support`, `Business`, or `Success` where release state is relevant.

## Task 8: Rollout notes and verification posture

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-phase15-rollout-notes.md`

- [ ] Document the Phase 15 rollout order.
- [ ] Define the minimum smoke sequence for:
  - login and entry
  - billing and checkout
  - support/status
  - trust/security
  - success/analytics
  - docs
  - bot readiness
- [ ] Document the go/no-go rule set.
- [ ] Document rollback expectations when a release is degraded after deploy.

## Task 9: Verification

**Files:**
- Reuse the new release and QA surfaces

- [ ] Build `admin-portal`.
- [ ] Confirm release and QA pages render without runtime regressions.
- [ ] Verify release records can be created and updated.
- [ ] Verify hard-gate logic behaves correctly with blocking vs non-blocking checks.
- [ ] Verify smoke pack recording behaves correctly.
- [ ] Verify environment audit summaries render cleanly.
- [ ] Verify nav visibility is internal-only.
- [ ] Review the rollout notes against the actual product surfaces already live.

---

## Definition of done for this tranche

- [ ] Veltrix has an internal `/releases` workspace.
- [ ] Veltrix has an internal `/qa` workspace.
- [ ] Release candidates have explicit lifecycle states.
- [ ] `webapp`, `portal`, and migrations are hard-gated.
- [ ] `docs` and `community_bot` are included in release scope and verification.
- [ ] Environment posture is visible from release truth.
- [ ] Smoke checks are structured and recorded.
- [ ] Migration linkage is explicit instead of memory-based.
- [ ] Go/no-go is derived from clear blocker and gate posture.
- [ ] Rollback notes exist as part of release detail instead of side-channel memory.
