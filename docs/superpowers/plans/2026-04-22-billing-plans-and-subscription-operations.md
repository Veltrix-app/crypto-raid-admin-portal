# Billing, Plans, And Subscription Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Veltrix from a product with visible plan labels into a revenue-capable system that can sell plans, start trials, create subscriptions, sync invoices, manage payment methods, enforce bounded entitlements, surface billing pressure clearly, and let internal operators resolve billing exceptions without backstage guesswork.

**Architecture:** Keep the billing model account-first, not project-first. `customer_accounts` remain the commercial owner; Stripe Billing becomes the external billing source; Supabase/Postgres stores the synchronized billing profile, subscription, invoice, event, and entitlement state; `veltrix-web` owns public pricing, checkout, success/cancel handoff, and Stripe webhook ingestion; `admin-portal` becomes the authenticated billing workspace and internal billing-ops surface; existing project-first product surfaces read entitlements rather than inventing their own plan logic. This phase should reuse the existing `billing_plans` catalog and `customer_accounts` foundation from Phase 9 instead of replacing them.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `veltrix-web`, `admin-portal`, Stripe Billing APIs, Stripe Checkout Sessions, Stripe Customer Portal, Stripe webhooks, existing account bootstrap layer, existing `billing_plans` table, existing account/workspace routes, Vercel env vars, and rollout notes under `docs/superpowers`.

---

## Scope framing

This phase is not "show pricing."

It is the full commercial and subscription spine for self-serve Veltrix:

- public pricing and plan selection
- checkout and trial start
- subscription state synchronization
- payment method and invoice visibility
- portal billing workspace
- account-level entitlement gating
- seat posture and billing pressure
- internal billing exception handling

The result should be:

- a real customer can choose a plan
- start or upgrade safely
- understand billing state from inside the product
- keep working through bounded `trial`, `active`, `past_due`, and `grace` states
- and internal operators can calmly resolve renewal or invoicing issues

without spreadsheets, hidden manual toggles, or silent access drift.

## Working assumptions

These are the planning assumptions for Phase 10:

- Stripe is the billing provider for v1.
- Self-serve plans are monthly only in this tranche.
- `Starter` and `Growth` remain self-serve.
- `Enterprise` is sales-managed and should not be directly purchasable from public checkout.
- One active subscription maps to one `customer_account`.
- `owner`, `admin`, and `member` count as billable seats by default.
- `viewer` remains non-billable in v1 so collaboration stays easy.
- Initial entitlement gating focuses on what the product already models clearly:
  - project count
  - active campaign count
  - billable seat count
  - high-touch support or enterprise posture flags
- Core trust, payout, and on-chain consoles are not newly price-gated in this tranche; the first safe version should gate capacity and commercial posture before gating deep feature families.
- Stripe Checkout starts subscriptions.
- Stripe Customer Portal handles self-serve billing changes.
- Stripe webhooks are the billing source of truth, not client redirects.

If any of these commercial assumptions change later, the data model in this phase should still be extensible enough to absorb annual billing, enterprise overrides, or more detailed feature gating.

## Out of scope for this phase

These are intentionally **not** part of this tranche:

- annual plans
- usage-metered billing
- coupon systems and discount engines
- tax localization depth
- multi-currency pricing
- white-glove invoicing outside the enterprise-managed path
- full CRM and revops workflows
- enterprise SSO/SAML contracts
- cross-surface revenue analytics beyond the minimum billing health reads needed for this phase

Those belong to later roadmap phases.

---

## Current posture in the codebase

Already present:

- `billing_plans` in the database
- `project_onboarding_requests.requested_plan_id`
- a portal billing page at `settings/billing`
- account statuses such as `pending_verification`, `active`, `trial`, `suspended`, and `closed`
- account/workspace ownership from Phase 9

Still missing:

- no real subscription table
- no billing customer profile
- no invoice snapshots
- no payment method state
- no Stripe integration
- no billing webhooks
- no entitlement engine
- no seat billing logic
- no internal billing ops queue

So Phase 10 should treat the existing billing page as a **usage placeholder** that now needs to be upgraded into a true commercial workspace.

---

## File Structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_billing_plans_subscription_operations.sql`
  - extends plan metadata and creates billing profile, subscription, invoice, event, and entitlement tables

### New webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\pricing\page.tsx`
  - public pricing and plan selection route
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\checkout\route.ts`
  - creates Stripe Checkout Sessions for self-serve plans
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\portal\route.ts`
  - creates Stripe Customer Portal sessions
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\success\page.tsx`
  - post-checkout success route with account handoff
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\canceled\page.tsx`
  - safe canceled/abandoned checkout surface
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\stripe\webhooks\route.ts`
  - Stripe webhook intake and billing sync trigger route
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\pricing-plan-grid.tsx`
  - reusable self-serve plan comparison grid
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\checkout-summary-card.tsx`
  - selected plan, trial, and seat posture summary
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\billing-success-card.tsx`
  - post-checkout confirmation and next-step guidance
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\stripe.ts`
  - Stripe client setup and shared helpers
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\checkout.ts`
  - Checkout Session creation helpers
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\customer-portal.ts`
  - Customer Portal session helpers
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\webhook-sync.ts`
  - webhook verification and database sync orchestration
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\billing-access.ts`
  - account-aware guardrails for checkout eligibility and enterprise exclusions

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-overview.ts`
  - shared account billing reads, usage calculations, and entitlement summaries
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-entitlements.ts`
  - project count, campaign count, seat count, and grace-state gating helpers
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-ops.ts`
  - internal billing exception reads and manual override helpers
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\billing\current\route.ts`
  - current account billing summary for authenticated surfaces
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\billing\ops\route.ts`
  - billing ops queue, filters, and operator detail data
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\billing\ops\[accountId]\route.ts`
  - operator actions like trial extension, grace extension, note, or enterprise flag
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\billing-ops\page.tsx`
  - internal billing operations workspace
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingSummaryPanel.tsx`
  - plan, renewal, payment method, invoice and entitlement overview
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingUsagePanel.tsx`
  - project, campaign and seat usage pressure
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingInvoicesPanel.tsx`
  - invoice history and current invoice state
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingSeatsPanel.tsx`
  - billable seat posture and role counts
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingOpsQueue.tsx`
  - internal failed renewal / past-due / enterprise review queue
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\billing-subscription.ts`
  - billing profile, subscription, invoice, entitlement, and billing-event types

### Modified webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`
  - public launch site links into the new pricing route
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\getting-started\page.tsx`
  - account entry should understand `trialing`, `past_due`, and billing-required posture
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\getting-started\account-entry-router.tsx`
  - route users into checkout or portal billing resolution when required
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\account\customer-account.ts`
  - expand account model to include billing summary and subscription posture

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\settings\billing\page.tsx`
  - upgrade from static usage snapshot to real billing workspace
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\account\page.tsx`
  - add account-level commercial posture and next billing event
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\page.tsx`
  - enforce project-cap entitlement posture
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\page.tsx`
  - enforce active campaign-cap entitlement posture
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\header\AdminHeader.tsx`
  - surface billing state or trial posture where useful
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
  - include billing ops for internal/admin users
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
  - add billing ops route
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\store\ui\useAdminPortalStore.ts`
  - expand billing plan, subscription, invoice, and entitlement loading
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`
  - add billing-related row types
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\account.ts`
  - expand account types with billing status where needed

### Verification targets

- `C:\Users\jordi\OneDrive\Documenten\New project`
  - `npm run typecheck --workspace veltrix-web`
  - `npm run build --workspace veltrix-web -- --webpack`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`
  - `npm run build`
- Stripe test mode verification:
  - checkout session creation
  - webhook receipt
  - customer portal launch
  - subscription sync
- manual migration review in Supabase SQL editor for `veltrix_billing_plans_subscription_operations.sql`

---

## Task 1: Add the billing schema and commercial contracts foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_billing_plans_subscription_operations.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\billing-subscription.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\account.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`

- [ ] Extend `billing_plans` with the metadata needed for real subscriptions:
  - self-serve visibility
  - sort order
  - included billable seats
  - trial days
  - feature or entitlement metadata
  - Stripe product and price identifiers
- [ ] Add `customer_account_billing_profiles` or equivalent to map a `customer_account` to a Stripe customer and commercial contact posture.
- [ ] Add `customer_account_subscriptions` with explicit states such as `trialing`, `active`, `past_due`, `grace`, `canceled`, and `enterprise_managed`.
- [ ] Add `customer_account_invoices` to store invoice snapshots needed for UI and operator workflows.
- [ ] Add `customer_account_billing_events` for webhook and manual adjustment audit visibility.
- [ ] Add `customer_account_entitlements` or equivalent persisted summary so product gating does not need to derive everything ad hoc on every screen.
- [ ] Add indexes and uniqueness constraints around account-to-customer and account-to-active-subscription mappings.
- [ ] Keep account status and billing status separate, but define how `trial`, `suspended`, and `closed` interact with billing state.

## Task 2: Define the plan catalog, entitlement model, and seat rules

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\billing-plan.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\data\mock\billing.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-entitlements.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\billing-access.ts`

- [ ] Turn the current plan ladder into a true commercial contract instead of a UI-only ladder.
- [ ] Define the initial self-serve plans and enterprise-managed posture explicitly:
  - which plans appear publicly
  - which plans are checkout-eligible
  - which plans are sales-managed only
- [ ] Define the first safe entitlement set:
  - max projects
  - max active campaigns
  - included billable seats
  - support posture flags
  - enterprise override flags
- [ ] Define billable seat counting in one place so product, checkout, and billing ops agree.
- [ ] Keep `viewer` non-billable in v1 unless later product evidence says otherwise.
- [ ] Define grace-state behavior so customers can still resolve billing without immediate lockout, but cannot expand indefinitely while unpaid.

## Task 3: Build public pricing, checkout, and customer portal entry

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\pricing\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\checkout\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\portal\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\success\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\canceled\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\pricing-plan-grid.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\checkout-summary-card.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\billing-success-card.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\stripe.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\checkout.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\customer-portal.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`

- [ ] Add a public pricing route that clearly separates self-serve plans from enterprise path.
- [ ] Use Stripe Billing APIs with Checkout Sessions for subscription start instead of custom payment forms.
- [ ] Make sure the selected account and selected plan map cleanly into the checkout session metadata.
- [ ] Keep enterprise-managed accounts out of self-serve checkout and route them toward contact/demo language instead.
- [ ] Add a Customer Portal launch path for upgrades, downgrades, cancellation, payment method updates, and invoice retrieval.
- [ ] Add success/canceled routes that reconnect the user to account onboarding or workspace entry instead of dead-ending after checkout.
- [ ] Keep pricing and billing copy founder-friendly, not finance-jargony.

## Task 4: Build Stripe webhook sync and billing source-of-truth handling

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\stripe\webhooks\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\webhook-sync.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\account\customer-account.ts`

- [ ] Verify Stripe webhook signatures safely.
- [ ] Sync customer, subscription, invoice, and payment-status changes into Supabase as the source of truth for product surfaces.
- [ ] Handle subscription lifecycle events such as:
  - checkout completed
  - subscription created
  - subscription updated
  - invoice paid
  - invoice payment failed
  - subscription canceled
  - payment method updated
- [ ] Write billing events into the audit table so internal ops can see what actually happened.
- [ ] Make webhook processing idempotent so retries do not create duplicate state or conflicting billing events.
- [ ] Define how a billing state change updates `customer_accounts.status` when necessary, especially for `trial`, `suspended`, and `closed`.

## Task 5: Upgrade the portal billing workspace and account billing surfaces

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\settings\billing\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\account\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingSummaryPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingUsagePanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingInvoicesPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingSeatsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\billing\current\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-overview.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\store\ui\useAdminPortalStore.ts`

- [ ] Replace the placeholder billing settings surface with a real account-aware billing workspace.
- [ ] Show:
  - current plan
  - subscription status
  - current period end
  - trial end
  - next invoice posture
  - payment method summary
  - invoice history
  - seat usage
  - project and campaign utilization
- [ ] Make the account page surface billing as part of workspace continuity, not a disconnected finance tab.
- [ ] Add clear calls to action for:
  - start checkout
  - manage billing
  - update payment method
  - review past-due state
- [ ] Keep the billing workspace calm and operator-readable, not generic SaaS clutter.

## Task 6: Add billing-aware entitlement gating and grace handling

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\getting-started\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\getting-started\account-entry-router.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-entitlements.ts`

- [ ] Enforce project-cap, active-campaign-cap, and billable-seat-cap decisions from one billing entitlement layer.
- [ ] Do not block existing operational access too aggressively; distinguish between:
  - creating new capacity
  - operating existing capacity
  - resolving billing posture
- [ ] Add `past_due` and `grace` messaging that explains the next safe move instead of silently failing.
- [ ] Allow operators and owners to resolve billing issues before hitting hard lockouts where possible.
- [ ] Make entitlement failures explainable in UI copy:
  - what limit was reached
  - which plan it belongs to
  - what the next move is
- [ ] Keep the first gating tranche focused on quantifiable limits rather than deep feature paywalls.

## Task 7: Build internal billing ops and manual exception handling

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\billing-ops\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingOpsQueue.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\billing\ops\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\billing\ops\[accountId]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-ops.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`

- [ ] Build an internal-only queue for accounts in states like:
  - past due
  - grace
  - trial ending soon
  - canceled but still active until period end
  - enterprise review needed
- [ ] Add manual actions for safe operator intervention:
  - note account
  - extend trial
  - extend grace
  - mark enterprise-managed
  - temporarily suspend account growth
- [ ] Keep these actions auditable and bounded. No silent mutation without event logging.
- [ ] Show the exact reason an account is in billing trouble, not just a red badge.
- [ ] Let super-admins see and resolve billing exceptions without dropping into Stripe dashboards for every issue.

## Task 8: Verification, env setup, rollout notes, and go-live quality pass

**Files:**
- Review all changed billing files across `veltrix-web` and `admin-portal`
- Review: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_billing_plans_subscription_operations.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-22-phase10-rollout-notes.md`

- [ ] Run `npm run typecheck --workspace veltrix-web` in `C:\Users\jordi\OneDrive\Documenten\New project`.
- [ ] Run `npm run build --workspace veltrix-web -- --webpack` in `C:\Users\jordi\OneDrive\Documenten\New project`.
- [ ] Run `npm run build` in `C:\Users\jordi\OneDrive\Bureaublad\admin-portal`.
- [ ] Write rollout notes for:
  - Stripe secret keys
  - webhook secret
  - success/cancel URLs
  - customer portal return URLs
  - billing env vars per Vercel project
  - Stripe test mode checklist
- [ ] Manually test these stories:
  - public pricing -> choose self-serve plan -> checkout
  - checkout success -> account billing summary updates
  - portal `Settings -> Billing`
  - customer portal launch
  - payment method update
  - simulated failed renewal -> `past_due`
  - simulated grace handling
  - project-cap and campaign-cap gating messages
- [ ] Confirm that enterprise-managed accounts are visible but not incorrectly routed through self-serve checkout.

---

## Self-Review

### Roadmap coverage

Covered:

- commercial model and plan posture
- self-serve plan selection
- subscription lifecycle and webhooks
- invoices and payment method posture
- seat logic
- entitlement gating
- internal billing ops
- account-aware billing messaging

Intentionally deferred:

- annual billing
- usage metering
- tax complexity
- coupons and promotions
- full revops/CRM
- deeper pricing experimentation

### Placeholder scan

No `TODO`, `TBD`, or open placeholders remain in this plan. The phase has concrete files, system boundaries, and a rollout sequence.

### Scope check

This phase is broad but still coherent because it revolves around one clear outcome:

- billing becomes a real operating system layer around `customer_accounts`

The task order is stable:

1. schema and contracts
2. plan and entitlement model
3. public checkout entry
4. webhook sync
5. portal billing surfaces
6. entitlement gating
7. internal billing ops
8. rollout and verification

That keeps the work focused and prevents Stripe integration, billing UI, and product gating from drifting into separate unowned projects.
