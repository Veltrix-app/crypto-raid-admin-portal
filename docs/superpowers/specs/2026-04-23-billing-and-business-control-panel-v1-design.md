# Billing And Business Control Panel v1 Design

Date: 2026-04-23
Status: Approved design
Scope: Customer-facing billing plus internal-only business control for Veltrix

## 1. Goal

Build the first real commercial operating layer for Veltrix.

This tranche should turn the current placeholder billing posture into:

- a real self-serve billing system for customers
- a real internal commercial cockpit for Veltrix operators
- a clear entitlement model that the product can enforce without hidden manual logic

The result should be that Veltrix can:

- let accounts start on `Free`
- upgrade into `Starter` or `Growth`
- route `Enterprise` into a sales-managed path
- sync commercial truth from Stripe safely
- show customers their billing and usage posture clearly
- show internal Veltrix operators how the business is performing and where intervention is needed

## 2. Product Position

This is not only a pricing page.

It is the first real business machine for Veltrix.

It has two connected layers:

- `Customer-facing Billing`
- `Internal Business Control Panel`

Customer-facing Billing exists so an account can understand, buy, upgrade, renew, and recover billing posture inside the product.

Internal Business Control Panel exists so Veltrix can run the business itself:

- revenue
- collections
- billing exceptions
- upgrade pressure
- account health

The internal panel is strictly for Veltrix admins. Customers must never see it.

## 3. Success Criteria

This design is successful when all of the following are true:

- a self-serve account can move from `Free` to `Starter` or `Growth` without manual backstage setup
- billing state is visible in product language instead of Stripe-only language
- entitlement pressure is understandable before and after a limit is hit
- over-limit actions lead to clear `Upgrade now` or `Pay and continue` recovery flows
- internal operators can answer:
  - what revenue is happening
  - what needs intervention now
  - which accounts are about to upgrade, fail, churn, or overload their plan

## 4. Scope

### 4.1 In Scope

- plan catalog for `Free`, `Starter`, `Growth`, and `Enterprise`
- Stripe customer and subscription synchronization
- public pricing route
- checkout flow for self-serve plans
- customer portal handoff for billing management
- invoice and payment method state visibility
- account-level entitlement model
- over-limit and near-limit product messaging
- customer-facing billing workspace in the portal
- internal-only Business Control Panel in the portal
- internal account-level commercial drilldown

### 4.2 Out of Scope

- annual plans
- usage-metered billing
- coupon systems
- deep tax localization
- multi-currency
- full accounting or ERP behavior
- CRM and sales pipeline management
- support queue integration
- customer success playbooks
- destructive financial actions from the portal such as direct refunds or invoice voiding

## 5. Commercial Model

### 5.1 Plan Ladder

Veltrix should use four plans in v1:

- `Free`
- `Starter`
- `Growth`
- `Enterprise`

`Free`, `Starter`, and `Growth` are visible in public pricing.

`Free` is a real ongoing tier, not only a temporary trial posture.

`Starter` and `Growth` are the true paid self-serve plans and should be monthly-only in v1.

`Enterprise` is visible publicly but must route to a sales-managed path instead of direct checkout.

### 5.2 Plan Philosophy

The ladder should rely primarily on scale gates, not excessive feature fragmentation.

That means the commercial model should mostly differ on:

- volume
- provider breadth
- seat posture
- automation depth
- support posture
- internal or advanced operator access

Core product value should stay visible across plans so `Free` still feels real.

### 5.3 Recommended v1 Plan Shape

#### Free

- price: `EUR 0`
- target: early evaluation and very small live usage
- limits:
  - `1` project
  - `1` active campaign
  - `10` live quests
  - `1` live raid at a time
  - `1` community provider
  - `2` billable seats
- posture:
  - real product usage
  - clear upgrade path
  - no advanced internal-facing or premium operating depth

#### Starter

- price target: `EUR 99/month`
- target: small live teams
- limits:
  - `2` projects
  - `5` active campaigns
  - `50` live quests
  - `5` live raids at a time
  - `2` providers
  - `5` billable seats

#### Growth

- price target: `EUR 299/month`
- target: serious multi-flow operators
- limits:
  - `5` projects
  - `25` active campaigns
  - `250` live quests
  - `20` live raids at a time
  - `2` providers
  - `15` billable seats

#### Enterprise

- price: custom
- target: high-touch accounts
- limits: custom or operator-defined
- posture:
  - sales-managed
  - enterprise-managed billing state
  - room for future SSO, compliance, SLA, and bespoke commercial terms

### 5.4 Feature Posture By Plan

The product should avoid chaotic feature gating, but a few clean differences are useful.

`Free` should include:

- core project, campaign, quest, reward, and member flows
- basic analytics
- basic launch posture
- one provider
- standard support posture

`Starter` should add:

- both Discord and Telegram posture
- basic automations
- stronger billing and usage visibility
- first real team-scale use

`Growth` should add:

- advanced automation and playbook posture
- richer operator and commercial tooling where customer-facing
- stronger support posture
- permissioned project-facing advanced operational views where already safe

`Enterprise` should not be defined by many extra toggles in v1.

It should primarily mean:

- custom commercial posture
- high-touch handling
- custom limits and enterprise-managed billing

### 5.5 Billable Seat Logic

Billable seats in v1 should be:

- `owner`
- `admin`
- `member`

Non-billable in v1:

- `viewer`

The product should count seats at the account level, not per project.

One user should never count twice inside the same customer account.

## 6. Entitlement And Limit Model

### 6.1 Entitlement Keys

The first persisted or derived entitlement set should include:

- `max_projects`
- `max_active_campaigns`
- `max_live_quests`
- `max_live_raids`
- `max_providers`
- `included_billable_seats`
- `trial_days`
- `self_serve_allowed`
- `enterprise_managed`
- `grace_until`

### 6.2 Usage Keys

The billing and business layers should also be able to show:

- `current_projects`
- `current_active_campaigns`
- `current_live_quests`
- `current_live_raids`
- `current_providers`
- `current_billable_seats`

### 6.3 Counting Rules

Only active or live capacity should count against plan limits.

Recommended rules:

- projects: count active customer-owned projects
- campaigns: count active or live campaigns
- quests: count published or live quests
- raids: count currently live raids
- providers: count active provider integrations
- seats: count unique billable account members

Draft and archived objects should not count.

### 6.4 Warning Thresholds

Entitlement pressure should become visible before the hard stop.

Recommended thresholds:

- `70% used`
  - soft informational posture
- `85% used`
  - warning posture
- `100% reached`
  - block only the growth action that needs new capacity

### 6.5 Hard Limit Rule

Veltrix should never hard-lock an account out of normal reading or management because of a limit.

At `100%`, the product should block only the next growth action, such as:

- creating another project
- publishing another campaign
- moving another quest live
- starting another live raid
- inviting another billable seat
- connecting another provider beyond the plan

Existing objects should remain readable and manageable.

## 7. Customer-Facing Billing Experience

### 7.1 Public Pricing

`veltrix-web` should own the public pricing route.

The pricing experience must:

- show `Free`, `Starter`, `Growth`, and `Enterprise`
- explain scale and plan differences clearly
- make `Starter` and `Growth` checkout-ready
- send `Enterprise` to a talk-to-us path

The page should use product language, not payment-processor language.

### 7.2 Checkout Flow

Stripe Checkout should handle self-serve paid upgrades and direct plan starts.

The system must support:

- account-aware plan selection
- next-plan preselection from over-limit flows
- success and cancel routes
- clear handoff back into product state

### 7.3 Customer Billing Workspace

The current portal route at:

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\settings\billing\page.tsx`

should evolve into a true billing workspace.

It should show:

- current plan
- billing status
- next renewal
- payment method state
- invoice history
- current usage
- entitlement pressure
- clear upgrade actions

### 7.4 Upgrade And Continue

Veltrix should support both:

- `Upgrade now`
- `Pay and continue`

`Upgrade now` is the standard billing action.

`Pay and continue` is the high-value recovery flow when a user tries to exceed plan capacity.

Expected behavior:

- the user attempts a blocked growth action
- the product explains the exact limit hit
- the next valid plan is preselected
- checkout opens
- after success, the user returns to the product
- the original action can resume cleanly

### 7.5 Billing Status Language

Customer-facing billing statuses in v1 should be:

- `trialing`
- `active`
- `past_due`
- `grace`
- `canceled`
- `enterprise_managed`

These should always be explained in plain language inside the UI.

## 8. Internal Business Control Panel

### 8.1 Purpose

The Business Control Panel is internal-only Veltrix tooling for running the business.

It is not a customer feature.

It should help Veltrix operators understand:

- how revenue is moving
- what billing issues need action
- which accounts are healthy, blocked, upgrade-ready, or at risk

### 8.2 Route Model

Recommended internal routes:

- `/business`
- `/business/accounts/[id]`

These routes should only render for internal Veltrix admins.

### 8.3 v1 Page Structure

The `/business` route should include:

- `Revenue Overview`
- `Collections Snapshot`
- `Billing Ops Queue`
- `Upgrade Pressure`
- `Account Health`
- `Accounts Table`

The `/business/accounts/[id]` route should include:

- account identity
- plan and subscription posture
- payment method posture
- invoice history
- usage and entitlement posture
- activation and commercial health posture
- notes
- operator actions

### 8.4 Internal Metrics

The v1 Business Control Panel should focus on these metrics:

#### Revenue

- `MRR`
- `ARR run rate`
- `active paid accounts`
- `trialing accounts`
- `free accounts`
- `new conversions`
- `upgrades`
- `downgrades`
- `churned accounts`

#### Collections

- `gross collected this month`
- `refund total`
- `net collected`
- `past due exposure`
- `upcoming renewals`
- `failed payment count`

#### Upgrade Pressure

- accounts near project limit
- accounts near campaign limit
- accounts near quest limit
- accounts near raid limit
- accounts near seat limit
- accounts near provider limit

#### Account Health

- accounts without first project
- accounts without first live campaign
- paid but underused accounts
- grace-state accounts
- accounts blocked by entitlement
- enterprise review accounts

### 8.5 Internal Status Model

Business Control Panel should use a clean commercial state model.

Billing status:

- `trialing`
- `active`
- `past_due`
- `grace`
- `canceled`
- `enterprise_managed`

Commercial health:

- `healthy`
- `watching`
- `upgrade_ready`
- `payment_risk`
- `churn_risk`
- `blocked`

Collections status:

- `clear`
- `renewing_soon`
- `payment_failed`
- `action_required`
- `refunded`

Activation status:

- `created`
- `workspace_ready`
- `first_project_created`
- `launch_setup_started`
- `live`
- `stalled`

### 8.6 Internal Operator Actions

The internal panel should support safe business actions in v1:

- `open Stripe customer`
- `open invoice`
- `open customer portal link`
- `extend trial`
- `extend grace`
- `mark enterprise-managed`
- `add internal note`
- `flag for review`
- `mark upgrade candidate`
- `mark churn risk`
- `mark high-touch follow-up`

It should not include direct destructive finance operations in v1.

## 9. Data Model

### 9.1 Existing Foundation To Reuse

This tranche should build on:

- `customer_accounts`
- `customer_account_memberships`
- `customer_account_onboarding`
- `billing_plans`
- `projects.customer_account_id`

### 9.2 New Billing Tables

Recommended new core tables:

- `customer_account_billing_profiles`
- `customer_account_subscriptions`
- `customer_account_invoices`
- `customer_account_billing_events`
- `customer_account_entitlements`

### 9.3 Optional Internal Notes Table

Recommended v1 support table:

- `customer_account_business_notes`

This table should support:

- internal notes
- operator ownership
- upgrade candidate notes
- churn-risk notes
- commercial follow-up context

### 9.4 Derived Business State

Not all business posture needs direct storage.

The following can be derived server-side in v1:

- `commercial_health_status`
- `activation_status`
- `upgrade_pressure_score`
- `payment_risk_status`

If needed later, these can become persisted rollups.

## 10. System Ownership

`veltrix-web` should own:

- public pricing
- checkout creation
- customer portal session creation
- billing success and cancel routes
- Stripe webhook intake

`admin-portal` should own:

- customer billing workspace
- internal Business Control Panel
- internal business account drilldown
- commercial operator actions

Stripe should remain the external payment and subscription source of truth.

Supabase/Postgres should remain the product-side synchronized commercial truth.

## 11. Non-Goals For v1 Business Control

The internal commercial cockpit is not:

- full finance accounting
- revenue recognition software
- a CRM
- a support desk
- a customer success platform

It is a founder and operator commercial cockpit first.

## 12. Build Order

Recommended build order:

1. billing schema and contracts foundation
2. plan catalog and entitlement model
3. public pricing and checkout
4. webhook sync and billing truth
5. customer-facing billing workspace
6. Business Control Panel dashboard
7. Business account drilldown
8. entitlement enforcement and `Pay and continue`
9. rollout verification

## 13. Definition Of Done

This tranche is done when:

- an account can live on `Free`
- self-serve paid plans can be purchased safely
- billing status, invoices, payment method state, and usage are visible in product
- over-limit actions trigger clear upgrade flows instead of dead ends
- internal Veltrix admins can see revenue, billing exceptions, upgrade pressure, and account health from one cockpit
- no critical commercial understanding depends on hidden spreadsheets or memory
