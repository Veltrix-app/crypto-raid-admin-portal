# Portal And Public UI Quiet-System Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a calmer Veltrix UI system that reduces bordered card overload, sharpens page intent, and makes the next best action obvious. Execute the rollout in controlled waves, beginning with the three portal pilot pages that define the product feel: `/overview`, `/projects`, and `/projects/[id]`.

**Architecture:** Treat the UI refresh as a shared surface-language program, not a one-off redesign. Establish the quiet-system rules first inside shared portal primitives and page composition patterns, then apply them to the pilot pages. Overview pages should become more editorial and direction-first; workspace and detail pages should become calmer command surfaces with less chrome and fewer equally weighted modules. Later waves reuse the same language for orientation pages, public surfaces, builders, internal ops, and docs.

**Tech Stack:** Next.js App Router, React, TypeScript, existing `admin-portal` shells and layout primitives, existing `veltrix-web` and `veltrix-docs` public layers for later waves, Tailwind utility styling already in use across the stack, and approved UI spec docs in `docs/superpowers/specs`.

---

## Scope framing

This document is the concrete execution plan for the first implementation tranche of the UI quiet-system rollout.

It does two things at once:

- defines the implementation order for the full A-to-Z UI program
- narrows the immediate build scope to the first three pilot pages

This keeps the design coherent while keeping the implementation safe and reviewable.

## Relationship to earlier planning

This document is the concrete execution plan for:

- [2026-04-24-portal-and-public-ui-quiet-system-rollout-design.md](C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-24-portal-and-public-ui-quiet-system-rollout-design.md)

It should be treated as the UI refinement layer that comes after:

- Phase 10 billing and business control
- Phase 11 support and status operations
- Phase 12 customer success
- Phase 13 analytics
- Phase 14 security and trust center
- Phase 15 release discipline
- Phase 16 commercial and buyer readiness

The product is already broad and operationally mature. This plan makes the interface calmer and clearer without reopening core product architecture.

## Working assumptions

- The first implementation tranche is portal-only.
- The first pilot pages are:
  - `/overview`
  - `/projects`
  - `/projects/[id]`
- Shared portal layout primitives can be refined as long as the changes do not regress existing internal surfaces.
- The initial rollout should prefer compositional and styling refinement over deep data-model changes.
- Public webapp, docs, builders, and internal ops beyond the pilot pages remain for later waves unless a shared primitive change directly affects them.
- The quiet-system program should reduce borders, nested cards, and competing chrome, but should not flatten Veltrix into generic empty minimalism.

## Out of scope for this tranche

- rebuilding every portal page at once
- full public-site redesign in this same pass
- builder redesign in this same pass
- internal ops page redesign beyond what shared primitives inevitably touch
- new data features, analytics features, or workflow logic
- changing product navigation or IA in a major way

---

## Product contract for the quiet-system v1

### Core UX rule

Every pilot page must make three things obvious within a few seconds:

- what this page is
- why it matters right now
- what the user should do first

### Surface language rules

- sections before cards
- typography before borders
- one primary action per viewport
- calm side rails
- color as meaning, not decoration

### Page family rules for tranche 1

#### `/overview`

Must read as:

- a calm command center
- direction first
- priorities before dense metrics

#### `/projects`

Must read as:

- a workspace index
- not a dashboard wall
- one place to understand project portfolio posture and move into the next project action

#### `/projects/[id]`

Must read as:

- a project command surface
- not a grid of equally loud widgets
- one dominant content path with quieter secondary context

---

## Full rollout map

The wider A-to-Z rollout remains:

### Wave 1: Portal pilot

- `/overview`
- `/projects`
- `/projects/[id]`

### Wave 2: Portal orientation

- `/getting-started`
- `/account`
- `/projects/[id]/launch`
- `/projects/[id]/settings`

### Wave 3: Public entry

- `/`
- `/start`
- `/pricing`
- `/trust`
- `/talk-to-sales`

### Wave 4: Core builders

- `/campaigns`
- `/campaigns/new`
- `/campaigns/[id]`
- `/quests`
- `/quests/new`
- `/quests/[id]`
- `/raids`
- `/raids/new`
- `/raids/[id]`
- `/rewards`
- `/rewards/new`
- `/rewards/[id]`

### Wave 5: Community and execution

- `/projects/[id]/community`
- captain, automation, command, and playbook surfaces

### Wave 6: Review and action detail

- `/submissions`
- `/submissions/[id]`
- `/claims`
- `/claims/[id]`
- `/users`
- `/users/[id]`

### Wave 7: Internal ops

- `/analytics`
- `/business`
- `/business/accounts/[id]`
- `/success`
- `/success/accounts/[id]`
- `/security`
- `/security/accounts/[id]`
- `/support`
- `/support/tickets/[id]`
- `/support/incidents/[id]`
- `/growth`
- `/growth/leads/[id]`
- `/releases`
- `/releases/[id]`
- `/qa`

### Wave 8: Docs

- docs home
- `/buyer-guides`
- flagship docs surfaces

This plan only implements Wave 1.

---

## File structure for tranche 1

### Shared portal primitives and layout files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\ops\OpsPrimitives.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\ops\OpsTable.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\PortalPageFrame.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\ProjectWorkspaceFrame.tsx`

### Pilot page files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`

### Pilot page supporting components

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsBoardHeader.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsOnboardingQueue.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsRosterTable.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewQuickActions.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewQueues.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewSummary.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\detail\DetailPrimitives.tsx`

### New rollout notes for this UI tranche

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-24-phase-ui-wave1-rollout-notes.md`

---

## Task 1: Establish the quiet-system surface rules in shared portal primitives

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\ops\OpsPrimitives.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\ops\OpsTable.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\PortalPageFrame.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\shell\ProjectWorkspaceFrame.tsx`
- Modify any shared detail primitives only if needed for quieter hierarchy

- [ ] Reduce default border intensity across shared ops panels, metric cards, and table containers.
- [ ] Remove unnecessary box-on-box styling where section spacing can carry separation instead.
- [ ] Tighten title, eyebrow, and description hierarchy so page headers do more orientation work.
- [ ] Define a calmer default spacing rhythm for grouped sections.
- [ ] Make side-rail styling quieter so it reads as supporting context, not a second dashboard.
- [ ] Preserve existing accessibility and interaction clarity while reducing chrome.

## Task 2: Redesign `/overview` as a direction-first command surface

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
- Modify supporting overview components only where necessary

- [ ] Rework the above-the-fold area so the page clearly communicates workspace status, main priorities, and one dominant reading path.
- [ ] Reduce the number of equally weighted blocks visible before the first scroll.
- [ ] Group health, escalation, and support modules into calmer sections instead of a module wall.
- [ ] Keep critical signal visibility, but make metrics secondary to current priorities and next actions.
- [ ] Ensure the page still works for super admin and project operator contexts without becoming visually noisy.

## Task 3: Redesign `/projects` as a calm workspace index

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsBoardHeader.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsOnboardingQueue.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectsRosterTable.tsx`

- [ ] Make the page read as a project workspace and portfolio surface, not a dashboard.
- [ ] Quiet the board header and reduce metric-card dominance.
- [ ] Make filters, search, and view toggles subordinate to the page title and main action.
- [ ] Ensure the onboarding queue and project list feel like grouped work areas rather than separate competing blocks.
- [ ] Keep first-project bootstrap for limited accounts highly visible but calmer and more linear.

## Task 4: Redesign `/projects/[id]` as a project command surface

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewQuickActions.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewQueues.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\projects\ProjectOverviewSummary.tsx`
- Modify detail primitives if needed for quieter composition

- [ ] Reframe the top of the page as one clear project summary and action surface.
- [ ] Reduce the sense of many equal widgets by establishing a dominant main column and quieter support context.
- [ ] Make quick actions feel intentional and grouped rather than floating command chips.
- [ ] Keep queue and summary modules visible, but merge or soften them where they currently fragment the page.
- [ ] Preserve deep project information while making the first reading pass much calmer.

## Task 5: Normalize page-family rules after the three pilot pages

**Files:**
- Modify the same pilot pages and shared primitives as needed after first-pass visual review

- [ ] Compare the three pilot pages against the approved quiet-system rules.
- [ ] Ensure they share a recognizable family language:
  - editorial overview
  - calm index workspace
  - quiet project detail
- [ ] Remove any leftover surface inconsistencies that would make later waves harder.

## Task 6: Document the rollout notes for Wave 1

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-24-phase-ui-wave1-rollout-notes.md`

- [ ] Record the scope of Wave 1.
- [ ] Document the visual goals for `/overview`, `/projects`, and `/projects/[id]`.
- [ ] Define the review checklist for judging whether the quieter language is actually working.
- [ ] Record what later waves will inherit from these pilots.

## Task 7: Verification

**Files:**
- Reuse the pilot pages and shared layout files

- [ ] Build `admin-portal`.
- [ ] Verify the three pilot pages render without runtime regressions.
- [ ] Verify navigation, filters, and primary actions still work.
- [ ] Verify super admin and non-super-admin differences still read correctly where applicable.
- [ ] Review whether the first viewport on each pilot page clearly communicates:
  - what the page is
  - why it matters
  - what to do first
- [ ] Review whether bordered card density is meaningfully reduced without harming clarity.

---

## Definition of done for this tranche

- [ ] Shared portal primitives reflect the quiet-system language.
- [ ] `/overview` reads as a direction-first command surface.
- [ ] `/projects` reads as a calm project workspace index.
- [ ] `/projects/[id]` reads as a quieter project command surface.
- [ ] The pilot pages feel more focused and less boxed-in than the current baseline.
- [ ] The three-second clarity rule is materially improved on all three pages.
- [ ] The resulting surface language is stable enough to carry forward into Wave 2 and beyond.
