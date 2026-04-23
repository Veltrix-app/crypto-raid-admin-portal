# Billing And Business Control Panel v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first complete Veltrix commercial spine: a real plan ladder, Stripe-backed subscriptions, customer-facing billing visibility, account-level entitlement enforcement, `Upgrade now` and `Pay and continue` flows, plus an internal-only Business Control Panel that lets Veltrix operators run revenue, collections, billing exceptions, upgrade pressure, and account health from inside the portal.

**Architecture:** Keep billing account-first, not project-first. `customer_accounts` remain the commercial owner; `billing_plans` becomes a true commercial contract with limit metadata and Stripe identifiers; Stripe Checkout and Billing provide the payment and subscription rails; `veltrix-web` owns pricing, checkout, Customer Portal handoff, success and cancel routes, and webhook ingestion; `admin-portal` owns the customer billing workspace plus the internal-only `/business` control layer; Supabase/Postgres stores synchronized billing profiles, subscriptions, invoices, events, entitlements, and business notes; portal and webapp product surfaces read entitlements instead of inventing plan logic locally.

**Tech Stack:** Next.js App Router, React, TypeScript, Stripe Billing APIs, Stripe Checkout Sessions, Stripe Customer Portal, Stripe webhooks, Supabase/Postgres, SQL migrations, `veltrix-web`, `admin-portal`, existing Phase 9 `customer_accounts` foundation, existing `billing_plans` table, Vercel env vars, and rollout notes under `docs/superpowers`.

---

## Scope framing

This is the concrete Phase 10 build tranche for:

- `Free / Starter / Growth / Enterprise`
- Stripe-backed paid billing
- customer-facing plan, usage, invoice, and renewal visibility
- over-limit growth blocking with upgrade recovery
- internal revenue and billing operations

This plan intentionally combines:

- customer-facing billing
- internal business control

because they depend on the same commercial truth and should not be built as disconnected systems.

## Relationship to earlier planning

This plan supersedes the narrower billing-only implementation framing from:

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\plans\2026-04-22-billing-plans-and-subscription-operations.md`

That earlier plan remains useful as historical context, but this document is now the concrete execution source for the combined tranche:

- billing engine
- customer billing workspace
- internal Business Control Panel

## Working assumptions

- `Free` is a real ongoing tier, not only a trial wrapper.
- `Starter` and `Growth` are monthly self-serve paid plans in v1.
- `Enterprise` is visible publicly but sales-managed only.
- Stripe is the billing provider in v1.
- One active subscription maps to one `customer_account`.
- `owner`, `admin`, and `member` are billable seats in v1.
- `viewer` is non-billable in v1.
- Entitlements in v1 are primarily scale-based:
  - project count
  - active campaign count
  - live quest count
  - live raid count
  - provider count
  - billable seat count
- Core trust, payout, and on-chain systems are not deeply price-gated in this tranche.
- `Upgrade now` and `Pay and continue` should block only the growth action that exceeded entitlement, not the whole account.
- The internal Business Control Panel is Veltrix-only and must never be exposed to customers.

## Out of scope for this tranche

- annual billing
- usage metering
- coupons and discount engines
- full finance accounting
- direct refund or invoice-void controls in the portal
- CRM
- support desk integration
- customer success playbooks
- enterprise SSO and compliance contracts

---

## Commercial contract for v1

### Plans

- `Free`
  - `EUR 0`
  - `1` project
  - `1` active campaign
  - `10` live quests
  - `1` live raid
  - `1` provider
  - `2` billable seats
- `Starter`
  - `EUR 99/month`
  - `2` projects
  - `5` active campaigns
  - `50` live quests
  - `5` live raids
  - `2` providers
  - `5` billable seats
- `Growth`
  - `EUR 299/month`
  - `5` projects
  - `25` active campaigns
  - `250` live quests
  - `20` live raids
  - `2` providers
  - `15` billable seats
- `Enterprise`
  - custom pricing
  - custom limits
  - sales-managed

### Warning thresholds

- `70% used` = informational
- `85% used` = warning / upgrade recommended
- `100% used` = block the specific growth action and offer upgrade recovery

### Hard-block posture

At `100%`, the product should only block:

- create another project
- publish another campaign
- push another quest live
- start another live raid
- invite another billable seat
- connect another active provider

The product should not block:

- reading existing data
- managing current objects
- opening billing
- paying or upgrading

---

## File structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_billing_and_business_control_panel_v1.sql`
  - extends `billing_plans` and creates billing plus business tables

### New webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\pricing\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\checkout\route.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\portal\route.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\success\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\canceled\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\stripe\webhooks\route.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\pricing-plan-grid.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\checkout-summary-card.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\billing-success-card.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\billing-upgrade-blocker.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\stripe.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\checkout.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\customer-portal.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\webhook-sync.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\billing-access.ts`

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\billing-subscription.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-overview.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-entitlements.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-ops.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\business-metrics.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\billing\current\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\billing\ops\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\billing\ops\[accountId]\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\business\overview\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\business\accounts\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\business\accounts\[id]\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\business\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\business\accounts\[id]\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingSummaryPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingUsagePanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingInvoicesPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingSeatsPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingOpsQueue.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\business\BusinessRevenuePanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\business\BusinessCollectionsPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\business\BusinessUpgradePressurePanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\business\BusinessAccountHealthPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\business\BusinessAccountsTable.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\business\BusinessAccountActionPanel.tsx`

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\settings\billing\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\account\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\header\AdminHeader.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\store\ui\useAdminPortalStore.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\billing-plan.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\account.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\data\mock\billing.ts`

### Modified webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\getting-started\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\getting-started\account-entry-router.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\account\customer-account.ts`

---

## Task 1: Add billing schema and commercial contracts foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_billing_and_business_control_panel_v1.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\billing-subscription.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\account.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`

- [ ] Extend `billing_plans` so it becomes a true commercial contract:
  - plan key
  - public visibility
  - self-serve eligibility
  - sort order
  - included billable seats
  - trial days
  - entitlement metadata
  - Stripe product and price identifiers
- [ ] Add `customer_account_billing_profiles` with Stripe customer mapping and commercial contact posture.
- [ ] Add `customer_account_subscriptions` with explicit statuses:
  - `free`
  - `trialing`
  - `active`
  - `past_due`
  - `grace`
  - `canceled`
  - `enterprise_managed`
- [ ] Add `customer_account_invoices` for invoice snapshots and customer-facing invoice history.
- [ ] Add `customer_account_billing_events` for webhook and manual billing audit visibility.
- [ ] Add `customer_account_entitlements` for persisted commercial limits and current usage snapshots.
- [ ] Add `customer_account_business_notes` for internal-only commercial context, owner notes, and follow-up state.
- [ ] Add indexes and uniqueness constraints around:
  - account-to-customer
  - account-to-active-subscription
  - Stripe object identifiers
- [ ] Keep account status separate from billing status and make the interaction explicit in schema comments and type contracts.

## Task 2: Define the plan catalog, seat rules, and entitlement model

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\billing-plan.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\data\mock\billing.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-entitlements.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\billing-access.ts`

- [ ] Encode the exact v1 plan ladder for `Free`, `Starter`, `Growth`, and `Enterprise`.
- [ ] Define the first safe entitlement keys:
  - max projects
  - max active campaigns
  - max live quests
  - max live raids
  - max providers
  - included billable seats
- [ ] Define billable seat logic so `owner`, `admin`, and `member` count once per account.
- [ ] Define warning thresholds at `70%`, `85%`, and `100%`.
- [ ] Define which product actions are blocked at `100%`.
- [ ] Define the next-plan recommendation logic so blocked actions know which plan to suggest.
- [ ] Keep `Enterprise` sales-managed and non-checkout.

## Task 3: Build public pricing and checkout flows

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\pricing\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\checkout\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\pricing-plan-grid.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\checkout-summary-card.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`

- [ ] Add a public pricing route that explains plan differences in product language.
- [ ] Make `Starter` and `Growth` purchaseable through Stripe Checkout.
- [ ] Route `Enterprise` to a sales or talk-to-us handoff.
- [ ] Preselect the next valid plan when entering pricing from an upgrade or blocked action.
- [ ] Show trial posture and what changes after payment clearly.
- [ ] Keep the pricing and checkout UI conversion-oriented but scoped to this commercial tranche.

## Task 4: Add Stripe customer portal and webhook synchronization

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\portal\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\success\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\billing\canceled\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\stripe\webhooks\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\stripe.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\checkout.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\customer-portal.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\billing\webhook-sync.ts`

- [ ] Add Stripe Customer Portal session creation for self-serve billing management.
- [ ] Add success and cancel routes that hand the user back into product posture cleanly.
- [ ] Verify Stripe webhook signatures and treat webhooks as source of truth.
- [ ] Sync:
  - customer profile
  - subscription state
  - invoices
  - payment method posture
  - commercial events
- [ ] Refresh entitlement snapshots when plan or subscription posture changes.
- [ ] Preserve a clear audit trail for manual and webhook-driven commercial state changes.

## Task 5: Upgrade the customer-facing billing workspace

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\settings\billing\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-overview.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingSummaryPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingUsagePanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingInvoicesPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\billing\BillingSeatsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\billing\current\route.ts`

- [ ] Replace the current placeholder usage page with real account billing data.
- [ ] Show:
  - current plan
  - billing status
  - next renewal
  - payment method posture
  - invoice history
  - seat posture
  - entitlement usage
- [ ] Add clear upgrade and billing-recovery actions.
- [ ] Explain billing states in plain language rather than raw Stripe wording.
- [ ] Make the billing workspace readable even when an account is in `past_due` or `grace`.

## Task 6: Build the internal Business Control Panel data layer

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\billing-ops.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\billing\business-metrics.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\billing\ops\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\billing\ops\[accountId]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\business\overview\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\business\accounts\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\business\accounts\[id]\route.ts`

- [ ] Build internal-only reads for:
  - MRR and ARR run-rate
  - plan mix
  - collections and refunds snapshots
  - failed payments
  - grace and past-due queues
  - upgrade pressure
  - account health and activation posture
- [ ] Add safe internal actions:
  - extend trial
  - extend grace
  - add note
  - mark enterprise-managed
  - mark upgrade candidate
  - mark churn risk
- [ ] Restrict all `/business` and business API routes to Veltrix admin-only access.

## Task 7: Build the `/business` dashboard

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\business\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\business\BusinessRevenuePanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\business\BusinessCollectionsPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\business\BusinessUpgradePressurePanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\business\BusinessAccountHealthPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\business\BusinessAccountsTable.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`

- [ ] Add a new internal-only `/business` route.
- [ ] Build the page as five clear sections:
  - revenue overview
  - collections snapshot
  - billing ops queue
  - upgrade pressure
  - account health
- [ ] Add an accounts table with filters for:
  - plan
  - billing status
  - commercial health
  - activation status
  - limit pressure
- [ ] Add the internal-only nav link without leaking it to customer roles.

## Task 8: Build the `/business/accounts/[id]` drilldown

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\business\accounts\[id]\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\business\BusinessAccountActionPanel.tsx`

- [ ] Add account drilldown for:
  - identity
  - current plan
  - subscription state
  - payment method posture
  - invoices
  - entitlement usage
  - activation posture
  - linked projects
  - business notes
  - internal actions
- [ ] Make the page the main internal destination for commercial account triage.

## Task 9: Enforce entitlements and build `Pay and continue`

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\projects\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\campaigns\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\quests\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\raids\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\getting-started\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\getting-started\account-entry-router.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\billing\billing-upgrade-blocker.tsx`

- [ ] Enforce project, campaign, quest, raid, provider, and seat caps using the shared entitlement model.
- [ ] Show soft warnings at `70%` and `85%`.
- [ ] At `100%`, block only the attempted growth action.
- [ ] Build `Upgrade now` and `Pay and continue` handoff UI for blocked actions.
- [ ] After successful upgrade, route the user back so the original action can continue cleanly.

## Task 10: Add verification, rollout notes, and acceptance coverage

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-phase10-rollout-notes.md`

- [ ] Verify schema locally and review the SQL migration before running in Supabase.
- [ ] Run:
  - `npm run typecheck --workspace veltrix-web`
  - `npm run build --workspace veltrix-web -- --webpack`
  - `npm run build` in `admin-portal`
- [ ] Verify Stripe test-mode flows:
  - checkout
  - customer portal
  - webhook sync
  - successful upgrade
  - canceled checkout
  - past-due handling
- [ ] Verify customer-facing routes:
  - `/pricing`
  - `/settings/billing`
- [ ] Verify internal routes:
  - `/business`
  - `/business/accounts/[id]`
- [ ] Verify over-limit flows for:
  - projects
  - campaigns
  - quests
  - raids
  - providers
  - seats

---

## Recommended execution order

1. `billing schema and contracts`
2. `plan catalog and entitlements`
3. `pricing and checkout`
4. `customer portal and webhooks`
5. `customer billing workspace`
6. `business data layer`
7. `business dashboard`
8. `business account drilldown`
9. `entitlement enforcement and pay-and-continue`
10. `verification and rollout`

## Definition of done

This tranche is done when:

- `Free`, `Starter`, `Growth`, and `Enterprise` exist as real commercial concepts in the product
- `Starter` and `Growth` can be purchased safely through Stripe
- customer-facing billing surfaces explain plan, invoice, payment, and usage posture clearly
- billing truth syncs from Stripe reliably
- over-limit actions offer upgrade recovery rather than dead ends
- Veltrix admins can run revenue and billing operations from `/business`
- no critical commercial workflow depends on hidden spreadsheets or memory
