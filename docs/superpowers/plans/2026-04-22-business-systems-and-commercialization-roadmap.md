# Business Systems And Commercialization Roadmap

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` when implementing any single phase from this roadmap. This document is a master roadmap, not a one-session implementation checklist.

**Goal:** Finish Veltrix not only as a product, but as a public, sellable, supportable, secure, measurable business system that can onboard customers, bill them, support them, grow them, and operate calmly at scale.

**Architecture:** Treat the next Veltrix chapter as eight connected layers above the already-built product surfaces: `Accounts and Self-Serve Onboarding`, `Billing and Subscription Operations`, `Support and Incident Communications`, `Customer Success and Activation`, `Growth and Revenue Analytics`, `Security and Compliance`, `QA and Release Engineering`, and `Commercial Assets and Revenue Operations`. Build them in that order so the company machine grows on top of a stable portal, webapp, docs, bot, trust, payout, on-chain, and observability stack.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `admin-portal`, `veltrix-web`, `veltrix-docs`, `veltrix-community-bot`, Vercel, Render, provider integrations, docs/specs under `docs/superpowers`, plus any future billing, CRM, support, and status integrations selected during phase execution.

---

## Scope framing

The product layer is now broad:

- public website
- public docs site
- admin portal
- member webapp
- bots
- trust, payout, on-chain, analytics, and runbook rails

What is still missing is the **business operating system around the product**.

This roadmap covers the systems required to move from:

- "the product exists"

to:

- "Veltrix can attract, onboard, bill, support, expand, secure, and operate real customers without improvised backstage work."

This roadmap should be executed as a sequence of focused implementation plans. Do not try to implement it all at once.

## Product and company posture today

Veltrix is no longer missing core product imagination.

What already exists in meaningful form:

- project-facing operating surfaces in the portal
- member-facing journeys in the webapp
- public site and public docs
- bot activation rails
- trust, payout, on-chain, and observability systems

What remains underbuilt:

- self-serve entry and account lifecycle
- commercial logic and subscriptions
- true customer support and incident communication rails
- customer success and activation operations
- funnel, conversion, retention, and revenue analytics
- security and compliance depth
- release engineering and regression discipline
- sales and commercial assets that make growth repeatable

## Guiding principles

- `Product is not enough`: a strong portal and webapp do not automatically create a sellable company system.
- `Public launch means public accountability`: onboarding, billing, support, privacy, and incidents must all feel deliberate.
- `Self-serve where safe, high-touch where useful`: Veltrix should support both `Start now` and `Book demo`, without creating two disconnected businesses.
- `Everything customer-facing needs an owner`: activation, support, billing, compliance, and release quality all need explicit surfaces and clear responsibility.
- `Bounded operations beat backstage heroics`: no critical customer workflow should depend on silent manual fixes or private knowledge.
- `Commercial systems must match product quality`: sales and onboarding surfaces should feel as intentional as the product itself.

## Relationship to the existing roadmap

This roadmap starts **after** the currently defined product phases:

1. `Platform Core Hardening`
2. `Project OS and Onboarding Excellence`
3. `Community OS Deepening`
4. `Member Journey Excellence`
5. `Bot Excellence`
6. `Trust, Payout, and On-chain Excellence`
7. `Analytics, Observability, and Runbooks`
8. `Launch Polish and Public Launch`

Those phases build the product.

The phases below build the **company-grade operating system around that product**.

---

## Phase 9: Accounts, Identity, And Self-Serve Onboarding

**Intent:** Let real customers discover Veltrix, create access, start a workspace, invite a team, and reach a usable first-run state without manual backstage setup.

**Why first:** Without a proper account and onboarding layer, Veltrix can be demoed and operated, but not truly adopted at scale.

### Deliverables

- [ ] Design a unified account model across public site, docs, portal, and member webapp where appropriate.
- [ ] Build public `Start now` entry with safe account creation and verification posture.
- [ ] Build project/workspace creation flow for a first live customer workspace.
- [ ] Add team invites, role assignment, and first-owner bootstrapping.
- [ ] Add first-run onboarding flows that route new customers into project creation, integrations, launch setup, and docs.
- [ ] Define access posture for demo applicants, self-serve trials, invited teammates, and internal staff.
- [ ] Add email verification, password reset, basic session hygiene, and identity-recovery flows.
- [ ] Add explicit account status states such as `pending verification`, `active`, `trial`, `suspended`, and `closed`.

### Exit criteria

- [ ] A new customer can go from public landing page to live workspace entry without internal manual setup.
- [ ] Team invites and role assignment are visible, safe, and recoverable.
- [ ] First-run onboarding explains what to do next instead of dropping users into product depth cold.

## Phase 10: Billing, Plans, And Subscription Operations

**Intent:** Turn Veltrix into a revenue-capable product with clear plans, subscription posture, invoices, and account status changes tied to billing reality.

**Why second:** Once users can self-enter, billing determines whether that entry turns into a sustainable business.

### Deliverables

- [ ] Define commercial model for plans, trial posture, seat posture, and enterprise/high-touch paths.
- [ ] Build billing surfaces for plan selection, upgrade, downgrade, cancellation, renewal, and invoice history.
- [ ] Add subscription status states such as `trialing`, `active`, `past_due`, `grace`, `canceled`, and `enterprise-managed`.
- [ ] Add seat logic for owner, teammate, captain-safe or operator-safe access where relevant.
- [ ] Add billing-aware entitlement gating in portal and workspace access.
- [ ] Add invoice and payment method management.
- [ ] Add internal billing ops visibility for failed renewals, manual extensions, credits, and account review.
- [ ] Add bounded billing notifications and account-status messaging across product and support surfaces.

### Exit criteria

- [ ] Veltrix can charge, renew, and correctly gate access without ad hoc manual intervention.
- [ ] Customers can understand their plan, seats, invoices, and next billing event from inside the product.
- [ ] Internal operators can see and resolve billing exceptions calmly.

## Phase 11: Support, Incident Communications, And Status Operations

**Intent:** Give Veltrix a real customer support system instead of relying on scattered contact routes and internal memory.

**Why third:** A public product needs visible support posture before user volume or incidents increase.

### Deliverables

- [ ] Define support intake model for contact requests, product questions, technical issues, billing issues, and abuse reports.
- [ ] Build support routes and support escalation surfaces for customers and internal operators.
- [ ] Add a real support queue or ticketing posture, whether built natively or integrated.
- [ ] Define incident communication model for product-wide incidents, degraded services, and customer-visible outages.
- [ ] Build public status and incident communication posture, whether on a dedicated status page or integrated support route.
- [ ] Add support ownership, waiting states, response states, and audit history.
- [ ] Add internal handoffs between support, trust, payout, on-chain, and product ops.
- [ ] Write customer-facing communication guidelines for warnings, incidents, degraded states, and resolution updates.

### Exit criteria

- [ ] A customer has a clear place to ask for help and understand service posture.
- [ ] Internal teams can track support ownership and escalation path instead of relying on inbox fragments.
- [ ] Veltrix can communicate incidents publicly without improvising language or routes.

## Phase 12: Customer Success, Activation, And Expansion Operations

**Intent:** Turn customer onboarding and growth into an intentional operating layer, not just something the product might cause if people figure it out.

**Why fourth:** Strong products still churn if activation and follow-through are not actively managed.

### Deliverables

- [ ] Define activation milestones from account creation to first live project, first launch, first active community, and first retained member flow.
- [ ] Build customer success views or workflows for onboarding posture, stalled accounts, activation blockers, and adoption health.
- [ ] Add guided onboarding sequences for self-serve and high-touch customers.
- [ ] Add success playbooks for demo follow-up, workspace activation, first launch support, and post-launch maturity.
- [ ] Add internal notes, ownership, and health-state visibility for customer accounts.
- [ ] Add product-driven nudges for stalled onboarding and underused features.
- [ ] Add expansion signals such as multiple projects, broader team usage, stronger community operations, or plan-pressure indicators.
- [ ] Define handoff from sales/demo intake into active customer success ownership where relevant.

### Exit criteria

- [ ] Veltrix can explain where a customer is in their activation journey.
- [ ] Stalled accounts and blocked launches are visible early instead of discovered by accident.
- [ ] Expansion and retention signals are captured in a system, not only in intuition.

## Phase 13: Growth, Funnel, Revenue, And Retention Analytics

**Intent:** Make commercial and product growth measurable end-to-end, from visitor interest to paid usage and long-term retention.

**Why fifth:** Once onboarding and success systems exist, the next constraint becomes understanding what is working commercially and what is leaking.

### Deliverables

- [ ] Define top-level funnel model from public site visit to signup, workspace creation, first launch, paid conversion, and retained account.
- [ ] Build analytics surfaces for acquisition, activation, conversion, retention, expansion, and churn risk.
- [ ] Add project-level and account-level health metrics that tie back to billing and success.
- [ ] Add revenue reporting posture for plans, active subscriptions, renewal state, trial conversion, and seat growth.
- [ ] Add attribution and conversion-path visibility where practical.
- [ ] Add docs and public-site performance analytics to understand how education and product proof influence conversion.
- [ ] Add operator-readable trend views rather than only raw event logs.
- [ ] Define and surface the metrics that matter most to founders and commercial operators.

### Exit criteria

- [ ] Veltrix can answer how users become customers and where they leak out.
- [ ] Revenue and activation are visible as connected systems, not separate spreadsheets.
- [ ] Founders can make roadmap and commercial decisions from internal product analytics with confidence.

## Phase 14: Security, Compliance, And Trust-Center Hardening

**Intent:** Give Veltrix the trust posture expected of a serious public platform with customer data, workspace access, and financial or incentive consequences.

**Why sixth:** Security and compliance depth become much more urgent once billing, support, and real customer operations are live.

### Deliverables

- [ ] Define account security baseline for password posture, sessions, recovery, and optional stronger authentication.
- [ ] Add 2FA and evaluate SSO/SAML posture for enterprise or higher-trust accounts.
- [ ] Add session management and suspicious access review flows.
- [ ] Add export/delete posture and lifecycle around account and customer data where required.
- [ ] Deepen privacy, terms, and data handling documentation into true compliance-ready operating language.
- [ ] Build a public trust/security center page with clear, honest posture and support contacts.
- [ ] Add internal security runbooks and incident response posture for auth, data, or provider compromise scenarios.
- [ ] Define backup, restore, and disaster recovery expectations and visibility.

### Exit criteria

- [ ] Veltrix can explain how account security, privacy, and data handling work in customer-ready language.
- [ ] Stronger auth and session-control options exist for serious customers.
- [ ] Internal teams have a real response posture for security incidents instead of only product-side recovery rails.

## Phase 15: QA, Release Engineering, And Environment Discipline

**Intent:** Make release quality predictable, repeatable, and observable across website, docs, portal, webapp, bots, and services.

**Why seventh:** The more customer-facing systems exist, the more dangerous ad hoc deployment discipline becomes.

### Deliverables

- [ ] Define staging, preview, production, and rollback posture across all deploy targets.
- [ ] Build regression coverage for the most critical portal, webapp, docs, auth, billing, support, trust, payout, and on-chain flows.
- [ ] Add smoke-test automation for the most business-critical routes and workflows.
- [ ] Add release checklists that cover product, billing, support, and incident-communication readiness.
- [ ] Add better deploy verification and post-deploy monitoring.
- [ ] Tighten environment variable discipline and secret ownership across Vercel, Render, Supabase, and future providers.
- [ ] Define release notes, change approval, and emergency rollback posture.
- [ ] Add clear ownership for release quality instead of treating it as a shared blur.

### Exit criteria

- [ ] Veltrix can ship predictably without relying on manual route clicking alone.
- [ ] The team can detect regressions and recover from bad deploys quickly.
- [ ] Release readiness covers commercial and support consequences, not just code deployment.

## Phase 16: Commercial Assets, Sales Operations, And Market Maturity

**Intent:** Turn Veltrix from a polished public product into a company that can repeatedly explain, sell, demo, and expand its value in market-facing contexts.

**Why last:** This layer compounds best once onboarding, billing, support, analytics, and security are already credible.

### Deliverables

- [ ] Build case-study posture once customer proof is available, without inventing or overclaiming before then.
- [ ] Expand the public site with stronger buyer-path storytelling for founders, growth leads, and community operators.
- [ ] Build sales/demo workflows that connect `Book demo`, applications, follow-up, and account creation cleanly.
- [ ] Add CRM posture or sales tracking for leads, demos, follow-ups, and conversion stages.
- [ ] Build richer templates, playbooks, starter packs, and commercial proof assets that reduce time-to-value.
- [ ] Add onboarding academy or richer educational content where it helps conversion and adoption.
- [ ] Define pricing communication posture, enterprise path, and plan comparison language more deeply.
- [ ] Add a lightweight revenue-operations loop tying commercial interest, activation, conversion, and customer maturity together.

### Exit criteria

- [ ] Veltrix can explain and sell itself repeatedly with system support, not only founder memory.
- [ ] Demo, signup, onboarding, and expansion flows are connected instead of fragmented.
- [ ] Public commercial posture feels as intentional as the product itself.

---

## Priority model

### Must build before calling the company system complete

- [ ] Phase 9: Accounts, Identity, And Self-Serve Onboarding
- [ ] Phase 10: Billing, Plans, And Subscription Operations
- [ ] Phase 11: Support, Incident Communications, And Status Operations
- [ ] Phase 12: Customer Success, Activation, And Expansion Operations
- [ ] Phase 13: Growth, Funnel, Revenue, And Retention Analytics
- [ ] Phase 14: Security, Compliance, And Trust-Center Hardening
- [ ] Phase 15: QA, Release Engineering, And Environment Discipline
- [ ] Phase 16: Commercial Assets, Sales Operations, And Market Maturity

### Foundational interpretation

If phases 1-8 made Veltrix a strong product, phases 9-16 make it a strong company operating system around that product.

## Recommended execution order

1. `Accounts, Identity, And Self-Serve Onboarding`
2. `Billing, Plans, And Subscription Operations`
3. `Support, Incident Communications, And Status Operations`
4. `Customer Success, Activation, And Expansion Operations`
5. `Growth, Funnel, Revenue, And Retention Analytics`
6. `Security, Compliance, And Trust-Center Hardening`
7. `QA, Release Engineering, And Environment Discipline`
8. `Commercial Assets, Sales Operations, And Market Maturity`

This order compounds correctly:

- first let real customers enter cleanly
- then monetize and govern access
- then support and communicate with them safely
- then help them activate and expand
- then measure the business clearly
- then harden trust and compliance posture
- then lock down release discipline
- then scale commercial maturity and revenue operations

## Definition of done for the full Veltrix company system

Veltrix is "done" at the broader company-system level when all of the following are true:

- [ ] a new customer can discover, sign up, create a workspace, and invite a team without manual intervention
- [ ] billing, plans, seats, and account status changes are visible and reliable
- [ ] support, incidents, and customer communications have a real operating surface
- [ ] customer success and activation are tracked, owned, and recoverable
- [ ] funnel, revenue, retention, and expansion metrics are visible end-to-end
- [ ] security and trust posture feel credible to serious customers
- [ ] releases are disciplined across all Veltrix surfaces
- [ ] commercial assets and sales operations make growth repeatable instead of founder-memory-driven

## Immediate next move

Do not treat this as one giant implementation plan.

Turn it into focused follow-up plans in this order:

1. `Accounts and Self-Serve Onboarding Plan`
2. `Billing and Subscription Operations Plan`
3. `Support and Incident Communications Plan`

That keeps the next chapter coherent and ensures Veltrix grows from a strong product into a strong company system without losing quality.
