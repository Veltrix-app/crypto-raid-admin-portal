# Growth, Funnel, Revenue, And Retention Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first full Veltrix analytics operating layer so founders, internal operators, and customers can all read the same connected truth from traffic to retained revenue. This tranche should capture attribution from the first public touch, track funnel and product movement through signup, workspace setup, launch, payment, and retention, and surface benchmark-safe analytics to customers without exposing peer data.

**Architecture:** Keep Phase 13 as one analytics system with multiple read models. Supabase/Postgres stores shared analytics events, funnel rollups, account and project growth snapshots, retention cohorts, and benchmark cohorts. `veltrix-web` owns public-touch attribution, signup and pricing funnel events, member journey and comeback events, and member-facing analytics signals. `admin-portal` owns workspace, project, billing, and customer-success-linked analytics events plus the internal analytics workspace and customer-safe portal analytics modules. Existing `Business` and `Success` surfaces consume the same analytics truth instead of inventing separate trend logic.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `admin-portal`, `veltrix-web`, existing billing and success foundations, attribution fields from public routes, customer account and project entities, cohort rollups, Vercel deployment, and `docs/superpowers` rollout notes.

---

## Scope framing

This is the concrete Phase 13 build tranche for:

- acquisition and commercial funnel analytics
- attribution capture from first touch to paid conversion
- shared product and community performance analytics
- revenue and retention analytics
- internal founder and growth analytics
- customer-facing analytics modules
- benchmark-safe cohort comparisons

This plan intentionally keeps funnel and product performance equally weighted.

Veltrix needs to answer both:

- how visitors become customers
- how customers become retained and expanding accounts

Customer-facing analytics are included in this tranche, not deferred, because benchmarked performance becomes much more useful when customers can see the same truths Veltrix uses internally.

## Relationship to earlier planning

This document is the concrete execution plan for:

- `Phase 13: Growth, Funnel, Revenue, And Retention Analytics`

from:

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\plans\2026-04-22-business-systems-and-commercialization-roadmap.md`

It should be executed after:

- Phase 9 account and onboarding foundation
- Phase 10 billing and business control
- Phase 11 support and incident operations
- Phase 12 customer success and activation

so the analytics layer can observe real business, support, and customer-success posture instead of placeholders.

## Working assumptions

- Attribution is required in v1 for:
  - first touch
  - latest touch
  - conversion touch
- Funnel and product analytics share the same event and snapshot foundation.
- Customer-facing analytics should only show the account's own data.
- Benchmarks must be cohort-based and safe; no raw peer account data can appear.
- `Business`, `Success`, and `Analytics` remain separate surfaces, but they must read from the same analytics truth.
- Customer analytics should be embedded into existing account, project, and analytics surfaces rather than creating a separate customer BI app.
- Minimum cohort size is required before benchmark labels render.
- v1 analytics should optimize for explainable operator decisions, not maximum BI flexibility.

## Out of scope for this tranche

- external data warehouse migration
- advanced multi-touch attribution modeling
- ad network API integrations beyond stored UTM/referrer context
- experimentation platform tooling
- raw customer exports and CSV reporting suites
- ML forecasting
- customer-visible raw cohort tables
- cross-customer comparisons that expose names, accounts, or project identities

---

## Product contract for v1

### Internal analytics workspace

- `/analytics`
  - executive summary
  - top-line funnel, revenue, retention, and source quality posture
- `/analytics/funnel`
  - visit to retained-customer flow
- `/analytics/revenue`
  - revenue and expansion posture
- `/analytics/retention`
  - retention, churn, grace recovery, and cohort health
- `/analytics/attribution`
  - source quality, conversion quality, and retained-revenue attribution

### Relationship to other internal workspaces

- `Business`
  - keeps money, collections, and commercial pressure
- `Success`
  - keeps activation, expansion, and churn triage
- `Analytics`
  - explains why those systems are moving the way they are

### Customer-facing analytics surfaces

- `/account`
  - account performance snapshot
  - benchmark-safe activation and retention posture
- `/projects/[id]`
  - project and community performance snapshot
- existing customer analytics routes
  - `/analytics/engagement`
  - `/analytics/rewards`
  - `/analytics/users`

### Benchmark posture

Customer-facing benchmark labels:

- `below peer range`
- `within peer range`
- `above peer range`
- `top cohort`

Benchmarks must never expose:

- peer account names
- peer project names
- raw peer rows
- cross-customer private metrics

---

## File structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_growth_funnel_revenue_and_retention_analytics_v1.sql`
  - shared analytics events, funnel rollups, account and project growth rollups, retention cohorts, benchmark cohorts

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\funnel\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\revenue\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\retention\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\attribution\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\analytics\funnel\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\analytics\revenue\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\analytics\retention\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\analytics\attribution\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\analytics\FunnelAnalyticsPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\analytics\RevenueAnalyticsPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\analytics\RetentionAnalyticsPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\analytics\AttributionAnalyticsPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\analytics\BenchmarkMetricCard.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\analytics\growth-analytics.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\analytics\growth-benchmarks.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\analytics\growth-events.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\growth-analytics.ts`

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\account\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\business\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\success\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`

### New webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\analytics\account\route.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\analytics\project\[id]\route.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\analytics\account-performance-card.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\analytics\project-performance-card.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\analytics\benchmark-band-card.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\analytics\attribution.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\analytics\customer-analytics.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\analytics\growth-events.ts`

### Modified webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\pricing\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\auth\sign-up\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\getting-started\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\home\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\community\onboarding\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\community\comeback\page.tsx`

---

## Task 1: Add analytics schema and contracts foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_growth_funnel_revenue_and_retention_analytics_v1.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\growth-analytics.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`

- [ ] Create `growth_analytics_events` for shared funnel, attribution, and performance events.
- [ ] Create `growth_funnel_snapshots` for daily funnel totals and conversion stages.
- [ ] Create `customer_account_growth_snapshots` for account-level activation, revenue, attribution, and retention posture.
- [ ] Create `project_growth_snapshots` for project and community performance posture.
- [ ] Create `retention_cohort_snapshots` for signup and paid retention cohorts.
- [ ] Create `benchmark_cohort_snapshots` for safe peer-range rollups.
- [ ] Add indexes for:
  - event type
  - occurred at
  - customer account id
  - project id
  - attribution source
  - cohort keys
- [ ] Keep event truth separate from read snapshots so backfills and recalculations stay possible.

## Task 2: Add attribution capture and carry-over

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\analytics\attribution.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\pricing\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\auth\sign-up\page.tsx`
- Modify: billing and account bootstrap write paths as needed

- [ ] Capture:
  - `utm_source`
  - `utm_medium`
  - `utm_campaign`
  - `utm_term`
  - `utm_content`
  - `referrer`
  - `landing_path`
- [ ] Preserve attribution through signup and workspace creation.
- [ ] Store first-touch, latest-touch, and conversion-touch posture.
- [ ] Write attribution into account-level analytics context once an account exists.
- [ ] Keep attribution safe for anonymous visitors before auth conversion.

## Task 3: Build shared analytics read models

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\analytics\growth-analytics.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\analytics\growth-events.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\analytics\growth-benchmarks.ts`

- [ ] Build internal reads for:
  - funnel posture
  - revenue posture
  - retention posture
  - attribution quality
  - account-level performance
  - project-level performance
- [ ] Build customer-safe reads for account and project analytics.
- [ ] Build benchmark reads with minimum cohort-size protection.
- [ ] Keep `Business` and `Success` able to consume analytics trends without duplicating logic.

## Task 4: Expand the internal analytics workspace

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\funnel\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\revenue\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\retention\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\analytics\attribution\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\analytics\funnel\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\analytics\revenue\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\analytics\retention\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\analytics\attribution\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\analytics\FunnelAnalyticsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\analytics\RevenueAnalyticsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\analytics\RetentionAnalyticsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\analytics\AttributionAnalyticsPanel.tsx`

- [ ] Add funnel view from visit to retained customer.
- [ ] Add revenue view for MRR, expansion, contraction, churn, and plan mix.
- [ ] Add retention view for cohorts, grace recovery, and churn pressure.
- [ ] Add attribution view for source quality, conversion quality, and retained revenue quality.
- [ ] Keep the top-level `/analytics` route as an executive summary that links into deeper subviews.

## Task 5: Add customer-facing analytics modules

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\analytics\account\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\analytics\project\[id]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\analytics\account-performance-card.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\analytics\project-performance-card.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\account\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\[id]\page.tsx`
- Modify: customer analytics surfaces as needed

- [ ] Add account-level performance summary for customers.
- [ ] Add project-level performance summary for customers.
- [ ] Show activation, launch, member activity, reward, and quest outcomes where relevant.
- [ ] Keep customer-facing analytics readable and product-safe, not founder-dashboard heavy.
- [ ] Reuse the same read models as internal analytics where safe.

## Task 6: Add benchmark logic and presentation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\analytics\benchmark-band-card.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\analytics\BenchmarkMetricCard.tsx`

- [ ] Build cohorting by:
  - plan tier
  - account age band
  - project category
  - chain or ecosystem
  - workspace size
  - maturity stage
- [ ] Enforce minimum cohort size before any benchmark renders.
- [ ] Present only:
  - peer range
  - percentile band
  - benchmark label
- [ ] Never surface raw peer account rows or identities.
- [ ] Embed benchmark context into customer metrics rather than building a separate benchmark app.

## Task 7: Connect analytics back into Business and Success

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\business\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\success\page.tsx`

- [ ] Feed source quality, retention pressure, and expansion trends into `Business`.
- [ ] Feed activation leakage and retention-risk trends into `Success`.
- [ ] Keep ownership clear:
  - `Business` operates money
  - `Success` operates accounts
  - `Analytics` explains the trend logic underneath

## Task 8: Verification, backfill, and rollout notes

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-phase13-rollout-notes.md`

- [ ] Run:
  - `npm run build` in `admin-portal`
  - `npm run typecheck --workspace veltrix-web`
  - `npm run build --workspace veltrix-web -- --webpack`
- [ ] Smoke test internal:
  - `/analytics`
  - `/analytics/funnel`
  - `/analytics/revenue`
  - `/analytics/retention`
  - `/analytics/attribution`
- [ ] Smoke test customer-facing:
  - account analytics modules
  - project analytics modules
  - benchmark labels
- [ ] Smoke test attribution:
  - visit -> pricing -> signup -> workspace -> paid conversion
- [ ] Smoke test retention and revenue:
  - paid conversion
  - renewal state
  - expansion path
  - churn and grace reads
- [ ] Write operator drills for:
  - weak acquisition source
  - signup-to-workspace leakage
  - launch-to-paid leakage
  - paid retention weakness
  - benchmark-safe customer explanation

---

## Recommended execution order

1. `analytics schema and contracts`
2. `attribution capture`
3. `shared analytics read models`
4. `internal analytics workspace`
5. `customer-facing analytics modules`
6. `benchmark layer`
7. `business and success linkage`
8. `verification and rollout`

## Definition of done

This tranche is done when:

- Veltrix can explain the path from traffic to retained revenue end-to-end
- attribution is captured from first touch through paid conversion and retention
- founders can clearly see funnel leaks, source quality, retention pressure, and expansion movement
- customers can see their own account and project performance clearly
- benchmark labels are safe, useful, and never expose peer data
- `Business`, `Success`, and `Analytics` all read from one connected analytics truth
