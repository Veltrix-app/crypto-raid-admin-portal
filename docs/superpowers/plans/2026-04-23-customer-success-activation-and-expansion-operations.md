# Customer Success, Activation, And Expansion Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real Veltrix success operating layer across both operator and customer surfaces: a shared activation truth model, an internal `/success` cockpit for customer success operations, customer-facing activation guidance inside onboarding and workspace flows, member-facing activation and comeback guidance in the webapp, plus in-product and email nudges that help accounts and members move from first setup to healthy ongoing usage.

**Architecture:** Keep Phase 12 as one activation system with multiple views. Supabase/Postgres stores account activation posture, success notes, follow-up tasks, derived success signals, member activation state, reactivation events, and nudge history. `admin-portal` owns the internal `/success` workspace and account drilldowns. Existing portal surfaces such as `/getting-started`, `/account`, and core project/launch pages expose customer-facing activation modules. `veltrix-web` extends existing onboarding, home, and comeback/member journey surfaces with activation and reactivation guidance. Billing, onboarding, support, and member journey data feed the same success truth so the product does not invent separate health logic in each surface.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `admin-portal`, `veltrix-web`, existing Phase 9 account foundation, existing Phase 10 billing/business control data, existing Phase 11 support/status data, existing member journey and comeback surfaces, Vercel env configuration, and `docs/superpowers` rollout notes.

---

## Scope framing

This is the concrete Phase 12 build tranche for:

- shared account and member activation truth
- internal customer success operations
- customer-facing workspace activation guidance
- member activation and reactivation guidance
- expansion and churn signals
- in-product and email success nudges

This plan intentionally combines:

- internal CS control
- customer-visible activation guidance
- member-visible activation and comeback guidance

because these all depend on the same milestone and health model.

## Relationship to earlier planning

This document is the concrete execution plan for:

- `Phase 12: Customer Success, Activation, And Expansion Operations`

from:

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\plans\2026-04-22-business-systems-and-commercialization-roadmap.md`

It should be executed after:

- Phase 9 account/onboarding
- Phase 10 billing/business control
- Phase 11 support/incident/status

so activation, expansion, and churn posture can use the real business and support context instead of placeholder logic.

## Working assumptions

- Success posture is shared across internal and customer-facing surfaces.
- `/success` is internal-only and visible only to Veltrix admins.
- Customer-facing activation is embedded into existing portal surfaces, not a separate app.
- Member-facing activation and reactivation are embedded into existing webapp journey/comeback surfaces.
- v1 nudge channels are:
  - `in_product`
  - `email`
- Discord and Telegram success nudges are out of scope for this tranche.
- Activation and health are measured at both:
  - account/workspace level
  - member level
- Billing and support context can influence success posture, but they remain separate source systems.
- The product should explain:
  - what is complete
  - what is missing
  - why it matters
  - what the next best move is

## Out of scope for this tranche

- CRM and sales pipeline management
- outbound lifecycle campaigns beyond activation/reactivation nudges
- Discord and Telegram customer success nudges
- deep revenue analytics beyond what Phase 10 already covers
- support desk feature expansion
- compliance and enterprise onboarding programs
- fully automated lifecycle orchestration across every product area

---

## Product contract for v1

### Internal success workspace

- `/success`
  - activation overview
  - stalled accounts
  - expansion-ready accounts
  - churn-risk accounts
  - follow-up queues
- `/success/accounts/[id]`
  - account success drilldown
  - milestones
  - blockers
  - product usage posture
  - billing and support context
  - member health summary
  - notes, tasks, and operator actions

### Customer-facing activation surfaces

- `/getting-started`
  - account and workspace setup posture
  - next move guidance
- `/account`
  - overall activation status
  - blockers
  - next best actions
- key project and launch surfaces
  - first campaign
  - provider connect
  - invite team
  - first live activity guidance

### Member-facing activation surfaces

- existing onboarding/journey surfaces
- existing comeback/reactivation surfaces
- relevant home/dashboard surfaces

These should show:

- next mission
- progress cues
- streak or return cues
- comeback guidance
- activation blockers where relevant

### Health states in v1

- workspace activation:
  - `not_started`
  - `activating`
  - `live`
  - `stalled`
- commercial and success health:
  - `healthy`
  - `watching`
  - `expansion_ready`
  - `churn_risk`
- member health:
  - `new`
  - `active`
  - `drifting`
  - `reactivation_needed`

### Nudge channels in v1

- `in_product`
- `email`

---

## File structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_customer_success_activation_and_expansion_v1.sql`
  - activation posture, success notes, tasks, signals, member activation, reactivation events, and nudge history

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\success\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\success\accounts\[id]\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\success\overview\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\success\accounts\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\success\accounts\[id]\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\success\accounts\[id]\notes\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\success\accounts\[id]\tasks\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\success\SuccessOverviewPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\success\SuccessQueueTable.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\success\SuccessAccountDetail.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\success\SuccessActivationRail.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\success\SuccessTaskPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\success\SuccessSignalPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\success\account-activation.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\success\success-overview.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\success\success-signals.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\success\success-actions.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\success.ts`

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\getting-started\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\account\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\account.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`

### New webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\success\account\route.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\success\member\route.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\success\account-activation-card.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\success\member-activation-card.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\success\member-comeback-card.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\success\account-activation.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\success\member-activation.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\success\nudges.ts`

### Modified webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\getting-started\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\community\onboarding\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\community\comeback\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\home\page.tsx`

---

## Task 1: Add activation and success schema foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_customer_success_activation_and_expansion_v1.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\success.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\account.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`

- [ ] Create `customer_account_activation` with milestone posture, blockers, health state, and next best action.
- [ ] Create `customer_account_success_notes` for internal CS notes and ownership.
- [ ] Create `customer_account_success_tasks` for follow-ups, due posture, and task state.
- [ ] Create `customer_account_success_signals` for derived states such as stalled, expansion-ready, or churn-risk.
- [ ] Create `member_activation_states` for member journey, health, last activity, and next move.
- [ ] Create `member_reactivation_events` for comeback prompts, returns, and outcomes.
- [ ] Create `activation_nudges` for channel, target type, reason, status, and outcome tracking.
- [ ] Add indexes for:
  - account health state
  - activation stage
  - success signal type
  - member health state
  - nudge status
  - nudge target type
- [ ] Keep onboarding, billing, support, and success posture linked by references rather than collapsed into one table.

## Task 2: Define the activation milestone and health model

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\success\success-contract.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\success\success-signals.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-success-language-and-nudge-posture.md`

- [ ] Encode account and workspace milestones:
  - account created
  - workspace created
  - first team invite
  - first project
  - first provider
  - first launch workspace open
  - first campaign live
  - first member activity
- [ ] Encode member milestones:
  - joined
  - first quest started
  - first quest completed
  - return visit
  - streak formed
  - reward claimed
  - comeback recovered
- [ ] Define workspace, success, and member health states.
- [ ] Define derived signal rules for:
  - stalled activation
  - low usage after payment
  - expansion readiness
  - member drift
  - reactivation needed
- [ ] Define the exact next-best-action model so every activation record can explain the recommended move.
- [ ] Write the success language model for activation, stall, recovery, and expansion prompts.

## Task 3: Build the internal `/success` overview data layer

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\success\success-overview.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\success\overview\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\success\accounts\route.ts`

- [ ] Build internal reads for:
  - activation overview
  - stalled accounts
  - accounts without first project
  - accounts without first live campaign
  - expansion-ready accounts
  - churn-risk accounts
  - member-drift summaries
- [ ] Merge in billing and support context where it materially affects success posture.
- [ ] Keep this read model Veltrix-internal only.

## Task 4: Build the `/success` dashboard

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\success\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\success\SuccessOverviewPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\success\SuccessQueueTable.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\success\SuccessSignalPanel.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`

- [ ] Add a new internal-only `/success` route.
- [ ] Show:
  - activation overview
  - stalled accounts
  - expansion signals
  - churn-risk signals
  - follow-up queues
- [ ] Add filterable account lists by:
  - workspace health
  - success health
  - expansion readiness
  - churn risk
  - activation stage
- [ ] Keep the nav and access Veltrix-admin only.

## Task 5: Build the `/success/accounts/[id]` drilldown

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\success\accounts\[id]\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\success\accounts\[id]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\success\accounts\[id]\notes\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\success\accounts\[id]\tasks\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\success\SuccessAccountDetail.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\success\SuccessTaskPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\success\success-actions.ts`

- [ ] Show full account success posture:
  - milestones
  - blockers
  - next best action
  - linked projects
  - billing posture
  - support posture
  - member health summary
  - notes and tasks
- [ ] Add safe internal actions:
  - add note
  - create follow-up task
  - resolve task
  - mark signal handled
- [ ] Make the drilldown the main internal CS triage surface.

## Task 6: Add customer-facing activation modules in the portal

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\success\SuccessActivationRail.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\getting-started\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\account\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\success\account-activation.ts`

- [ ] Add customer-facing activation summaries to `/getting-started`.
- [ ] Add activation posture and blockers to `/account`.
- [ ] Explain:
  - what is complete
  - what is missing
  - why it matters
  - what happens next
- [ ] Keep the activation UI helpful and bounded, not noisy or generic.

## Task 7: Add member activation and reactivation modules in the webapp

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\success\account\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\success\member\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\success\account-activation-card.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\success\member-activation-card.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\success\member-comeback-card.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\success\account-activation.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\success\member-activation.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\getting-started\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\community\onboarding\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\community\comeback\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\home\page.tsx`

- [ ] Add member-facing progress and next-action guidance.
- [ ] Add comeback and reactivation guidance for drifting members.
- [ ] Show why the next action matters and what it unlocks.
- [ ] Keep the member experience coherent with the existing journey and comeback surfaces.

## Task 8: Add nudge rails and success logging

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\success\nudges.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\success\success-actions.ts`

- [ ] Add in-product nudge creation and logging for account, project, and member targets.
- [ ] Add email nudge event logging for activation and reactivation use cases.
- [ ] Prevent duplicate or contradictory nudges from being emitted too closely together.
- [ ] Record outcome posture:
  - pending
  - shown
  - sent
  - dismissed
  - completed
- [ ] Keep v1 nudge delivery bounded and explainable.

## Task 9: Verification, rollout notes, and activation drills

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-phase12-rollout-notes.md`

- [ ] Run:
  - `npm run build` in `admin-portal`
  - `npm run typecheck --workspace veltrix-web`
  - `npm run build --workspace veltrix-web -- --webpack`
- [ ] Smoke test internal:
  - `/success`
  - `/success/accounts/[id]`
  - notes and tasks
- [ ] Smoke test customer-facing:
  - `/getting-started`
  - `/account`
  - activation blockers and next steps
- [ ] Smoke test member-facing:
  - onboarding progress
  - comeback guidance
  - home progress cues
- [ ] Smoke test nudge logging:
  - in-product activation nudge
  - reactivation event
  - email nudge event trail
- [ ] Write the operator drill for:
  - stalled after signup
  - first project never created
  - paid account with low usage
  - member drift after first completion
  - expansion-ready workspace

---

## Recommended execution order

1. `activation schema and contracts`
2. `activation milestone and health model`
3. `internal success data layer`
4. `internal success dashboard`
5. `success account drilldown`
6. `customer-facing activation modules`
7. `member activation and reactivation modules`
8. `nudge rails and logging`
9. `verification and rollout`

## Definition of done

This tranche is done when:

- Veltrix has one shared activation truth across internal, customer, and member surfaces
- internal `/success` lets Veltrix admins triage activation, expansion, and churn posture
- customers can see what is complete, what is missing, and what to do next
- members can see activation and comeback guidance in the webapp
- billing and support context can influence success posture without becoming duplicate systems
- in-product and email nudges are logged and bounded
- success operations no longer depend on memory, spreadsheets, or ad hoc follow-up
