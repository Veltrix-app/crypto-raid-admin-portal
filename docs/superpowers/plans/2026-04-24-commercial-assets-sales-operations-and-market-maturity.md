# Commercial Assets, Sales Operations, And Market Maturity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first complete Veltrix market machine so self-serve customers can understand, trust, and buy the product quickly, enterprise buyers can evaluate it confidently, and internal Veltrix operators can run leads, requests, and follow-up from one connected commercial system.

**Architecture:** Keep Phase 16 as one shared commercial substrate with four views: public conversion surfaces, buyer and enterprise intake, internal `/growth` commercial ops, and buyer-ready docs. Shared Postgres stores lead truth, buyer request intake, follow-up tasks, and lead-event timelines. `veltrix-web` owns the public commercial surfaces and intake entry points. `veltrix-docs` owns buyer education, pricing explanation, and workflow explainers. `admin-portal` owns the internal commercial workspace and lead drilldowns. Existing billing, trust, support, success, and analytics systems remain the operational truth underneath the commercial story.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `veltrix-web`, `veltrix-docs`, `admin-portal`, existing pricing/billing/trust/success/analytics layers, Vercel deployment, and rollout notes in `docs/superpowers`.

---

## Scope framing

This is the concrete Phase 16 build tranche for:

- public conversion surfaces
- pricing and plan presentation
- enterprise and buyer intake
- internal commercial ops
- lead tracking and follow-up
- docs as a sales and buyer-education surface

This plan intentionally combines:

- self-serve conversion
- enterprise credibility
- lightweight internal sales ops

because launch readiness depends on public clarity, buyer trust, and internal commercial follow-through all working together.

## Relationship to earlier planning

This document is the concrete execution plan for:

- `Phase 16: Commercial Assets, Sales Operations, And Market Maturity`

from:

- [2026-04-24-commercial-assets-sales-operations-and-market-maturity-design.md](C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-24-commercial-assets-sales-operations-and-market-maturity-design.md)

It should be executed after:

- Phase 10 billing and business control
- Phase 11 support and status operations
- Phase 12 customer success
- Phase 13 analytics
- Phase 14 security and trust center
- Phase 15 QA and release engineering

so the public and commercial layers can confidently point at real, already-built product and operational systems.

## Working assumptions

- Veltrix stays self-serve-first, but must look credible to enterprise buyers.
- Phase 16 must not become a full CRM replacement.
- Existing pricing, trust, support, and success systems are real dependencies, not mocked layers.
- `veltrix-web` is the main public commercial surface.
- `veltrix-docs` must help sell and explain the product, not only document usage.
- `admin-portal` should expose an internal commercial workspace at `/growth`.
- Lead creation should be driven by meaningful buyer actions, not every anonymous visit.
- Internal lead follow-up should be lightweight, structured, and visible enough to avoid relying on chat or memory.

## Out of scope for this tranche

- full CRM or deal pipeline platform
- quote, contract, or procurement automation
- outbound campaign automation
- ad platform syncs
- full visual rebrand across every product surface
- deep marketing automation stacks

---

## Product contract for v1

### Public commercial surfaces

- `/`
  - sharpened positioning and primary conversion entry
- `/start`
  - clear split between self-serve and guided help
- `/pricing`
  - clean package comparison
  - enterprise CTA posture
  - better upgrade and plan explanation
- `/talk-to-sales` or `/contact`
  - buyer and enterprise intake
- optional `/enterprise`
  - bounded enterprise overview if needed

### Internal commercial surface

- `/growth`
  - lead queue
  - enterprise requests
  - high-intent buyers
  - follow-up tasks
  - converted and expansion-linked leads
- `/growth/leads/[id]`
  - lead detail
  - notes
  - tasks
  - source and intent signals
  - linked customer/account context

### Docs buyer maturity

- buyer-facing product overview pages
- pricing explanation docs
- launch workflow docs
- trust and enterprise references

### Lead states in v1

- `new`
- `qualified`
- `watching`
- `engaged`
- `evaluation`
- `converted`
- `cooling_off`
- `lost`

---

## File structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_commercial_assets_sales_operations_and_market_maturity_v1.sql`
  - commercial leads, lead events, lead notes, follow-up tasks, demo requests, and enterprise intake requests

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\growth\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\growth\leads\[id]\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\growth\overview\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\growth\leads\[id]\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\growth\leads\[id]\notes\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\growth\leads\[id]\tasks\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\growth\GrowthOverviewPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\growth\LeadQueuePanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\growth\LeadDetailPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\growth\LeadNotesPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\growth\LeadTasksPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\growth\growth-overview.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\growth\growth-actions.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\growth-sales.ts`

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- any internal dashboards that should cross-link into `/growth`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`

### New webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\talk-to-sales\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\commercial\demo-request\route.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\commercial\enterprise-intake\route.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\enterprise-cta-band.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\request-demo-form.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\commercial\lead-intake.ts`

### Modified webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\start\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\pricing\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\trust\page.tsx`

### Docs files

- buyer-facing docs entrypoints or updated docs pages under:
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-docs\src\app\...`
- new product overview, pricing explanation, workflow, and enterprise guidance pages as needed

### Support docs and rollout notes

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-24-phase16-rollout-notes.md`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-24-commercial-language-and-positioning-posture.md`

---

## Task 1: Add commercial lead and intake schema foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_commercial_assets_sales_operations_and_market_maturity_v1.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\growth-sales.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`

- [ ] Create `commercial_leads` with lead state, source, contact info, owner, linked customer account, and metadata.
- [ ] Create `commercial_lead_events` for buyer and sales timeline history.
- [ ] Create `commercial_lead_notes` for internal commercial notes.
- [ ] Create `commercial_follow_up_tasks` for structured next steps and due posture.
- [ ] Create `demo_requests` for request-demo and talk-to-sales intake.
- [ ] Create `enterprise_intake_requests` for enterprise requirements and higher-intent buyer intake.
- [ ] Add indexes for:
  - lead state
  - owner
  - source
  - linked customer account id
  - due state
  - created at

## Task 2: Define commercial language, lead rules, and intake contracts

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-24-commercial-language-and-positioning-posture.md`
- Create any shared contract helpers needed under portal/webapp commercial libs

- [ ] Define the v1 lead-state machine:
  - `new`
  - `qualified`
  - `watching`
  - `engaged`
  - `evaluation`
  - `converted`
  - `cooling_off`
  - `lost`
- [ ] Define what counts as:
  - traffic
  - interested buyer
  - qualified lead
  - active commercial conversation
  - converted customer
- [ ] Define self-serve vs enterprise language guidance.
- [ ] Define package presentation guidance for `Free`, `Starter`, `Growth`, and `Enterprise`.
- [ ] Define CTA copy posture for:
  - create account
  - start now
  - talk to sales
  - request demo
  - enterprise review

## Task 3: Harden public conversion surfaces

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\start\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\pricing\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\trust\page.tsx`
- Create supporting marketing components as needed

- [ ] Sharpen homepage positioning and primary CTA structure.
- [ ] Make `/start` a clearer split between self-serve start and guided help.
- [ ] Make `/pricing` more buyer-ready:
  - plan differentiation
  - enterprise CTA posture
  - package meaning and use cases
- [ ] Keep trust and pricing aligned so serious buyers can move naturally between them.
- [ ] Ensure all key public commercial routes work well on desktop and mobile.

## Task 4: Add buyer and enterprise intake flows

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\talk-to-sales\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\commercial\demo-request\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\commercial\enterprise-intake\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\marketing\request-demo-form.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\commercial\lead-intake.ts`

- [ ] Build a real request-demo or talk-to-sales route.
- [ ] Support enterprise intake with:
  - contact info
  - company/team context
  - use case
  - urgency
  - enterprise/security/billing requirements
- [ ] Store demo and enterprise requests in shared Postgres.
- [ ] Convert qualifying requests into linked commercial leads.
- [ ] Keep the intake bounded and high-signal, not long-form enterprise paperwork.

## Task 5: Build the internal `/growth` commercial workspace

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\growth\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\growth\leads\[id]\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\growth\overview\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\growth\leads\[id]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\growth\leads\[id]\notes\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\growth\leads\[id]\tasks\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\growth\GrowthOverviewPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\growth\LeadQueuePanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\growth\LeadDetailPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\growth\LeadNotesPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\growth\LeadTasksPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\growth\growth-overview.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\growth\growth-actions.ts`

- [ ] Build `/growth` as the internal commercial command surface.
- [ ] Show:
  - new leads
  - enterprise requests
  - engaged and evaluation leads
  - converted leads
  - cooling or lost leads
  - follow-up tasks due now
- [ ] Build `/growth/leads/[id]` with:
  - lead identity
  - source and intent context
  - notes
  - tasks
  - linked account if converted
- [ ] Keep the workspace internal-only for Veltrix admins.

## Task 6: Connect commercial signals to pricing, trust, docs, and analytics

**Files:**
- Modify public commercial routes and shared commercial libs as needed
- Modify `admin-portal` growth reads where lead qualification or conversion linkage depends on existing systems

- [ ] Link pricing, trust, and contact/demo activity into commercial lead creation where appropriate.
- [ ] Use existing analytics and account context to enrich leads with:
  - source
  - return intent
  - conversion linkage
  - expansion signals where relevant
- [ ] Link converted leads back to `customer_accounts`.
- [ ] Surface launch-ready and expansion-ready context in `/growth` without duplicating `Business` or `Success`.

## Task 7: Add buyer-ready docs maturity

**Files:**
- Create or modify buyer-facing docs pages under:
  - `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-docs\src\app\...`

- [ ] Add a product overview doc path for buyers.
- [ ] Add pricing or package explainer docs.
- [ ] Add workflow docs that explain how Veltrix fits into real launch operations.
- [ ] Add enterprise/trust references where they help evaluation.
- [ ] Make docs feel like part of the commercial story, not a disconnected reference pile.

## Task 8: Add nav and internal cross-links

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- Modify any internal dashboards where a `/growth` link materially helps

- [ ] Add `Growth` to internal portal navigation.
- [ ] Keep it visible only to internal Veltrix admins.
- [ ] Add lightweight cross-links from `Business`, `Success`, `Analytics`, or `Support` where commercial follow-up is relevant.

## Task 9: Rollout notes and verification posture

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-24-phase16-rollout-notes.md`

- [ ] Document the Phase 16 rollout order.
- [ ] Define the minimum smoke sequence for:
  - homepage
  - start flow
  - pricing
  - trust
  - talk-to-sales / contact intake
  - `/growth`
  - lead drilldown
  - buyer-facing docs
- [ ] Document the self-serve vs enterprise guidance posture.
- [ ] Document how demo and enterprise requests should be reviewed internally after launch.

## Task 10: Verification

**Files:**
- Reuse the new commercial surfaces and internal growth workspace

- [ ] Build `admin-portal`.
- [ ] Build `veltrix-web`.
- [ ] Build `veltrix-docs`.
- [ ] Confirm public commercial routes render without runtime regressions.
- [ ] Verify buyer request and enterprise intake flows create records correctly.
- [ ] Verify `/growth` loads and updates leads, notes, and follow-up tasks correctly.
- [ ] Verify internal nav visibility is internal-only.
- [ ] Review docs, pricing, trust, and start flow together for one coherent commercial story.

---

## Recommended execution order

1. `commercial schema and contracts`
2. `commercial language and package posture`
3. `public conversion hardening`
4. `buyer and enterprise intake`
5. `internal /growth workspace`
6. `signal integration`
7. `buyer-ready docs pass`
8. `nav integration`
9. `rollout notes`
10. `verification`

## Definition of done

This tranche is done when:

- Veltrix has a clear public conversion story
- pricing and package presentation are launch-ready
- self-serve and enterprise entry paths are both obvious
- buyer and enterprise requests land in a real system
- internal `/growth` exists as a real commercial ops cockpit
- leads have states, notes, owner, and follow-up posture
- docs help sell and explain the product, not just document it
- trust, pricing, start flow, docs, and sales intake all tell the same commercial story

