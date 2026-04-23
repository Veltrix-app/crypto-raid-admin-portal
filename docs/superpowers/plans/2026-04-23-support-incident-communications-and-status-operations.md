# Support, Incident Communications, And Status Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real Veltrix support and incident operating layer: a customer-facing support entry, a structured internal support queue, clear handoffs into trust/payout/on-chain/product ops, a public service-status posture, and an internal incident command surface that lets Veltrix communicate degraded service without improvising language or workflow.

**Architecture:** Keep this tranche split into two connected rails: `Customer Support Entry` and `Internal Support + Incident Command`. `veltrix-web` owns customer-facing support intake, public service-status visibility, and customer-safe incident updates; `admin-portal` owns the internal support queue, ticket drilldowns, incident command, operator handoffs, and audit history; Supabase/Postgres stores support cases, incident records, communication events, handoff state, and public status snapshots; docs later explain how support and incident posture work, but this tranche builds the real operating rails first.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, SQL migrations, `veltrix-web`, `admin-portal`, existing billing/account foundation, trust/payout/on-chain consoles, observability/runbook posture, Vercel, and `docs/superpowers` for rollout notes and communication patterns.

---

## Scope framing

This is the concrete Phase 11 build tranche for:

- customer-facing support intake
- internal ticket triage and ownership
- public service status
- incident declaration and update flows
- handoffs between support and deep operator consoles
- communication language for degraded, blocked, and resolved states

This plan intentionally treats support and incident communications as one operating system.

Customers need:

- one clear place to ask for help
- one clear place to understand platform health

Veltrix operators need:

- one clear place to triage support
- one clear place to run incidents
- one clear place to hand work into trust, payout, on-chain, billing, or product ops

## Relationship to earlier planning

This document is the concrete execution plan for:

- `Phase 11: Support, Incident Communications, And Status Operations`

from:

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\plans\2026-04-22-business-systems-and-commercialization-roadmap.md`

It should be executed after the account and billing layers are already in place, so support can be account-aware and billing-aware instead of becoming a disconnected inbox.

## Working assumptions

- Support is a Veltrix-owned system, not only a mailto link or shared inbox.
- Customer-facing support remains public or account-safe, but internal triage stays in the portal.
- Incidents are first-class records, not only ad hoc banner messages.
- Public status should be readable without requiring portal access.
- Tickets can hand off into:
  - billing
  - trust
  - payout
  - on-chain
  - product ops
  - general support
- This tranche should support both:
  - simple customer questions
  - operator-grade incident coordination
- v1 can be read-heavy and action-safe; it does not need a full Zendesk competitor.

## Out of scope for this tranche

- third-party helpdesk integrations
- live chat
- full SLA engine
- outbound email campaign tooling
- customer success playbooks
- automated knowledge base answer generation
- public multi-region infra status
- compliance response operations

---

## Product contract for v1

### Customer-facing surfaces

- `/support`
  - clear support entry
  - support form categories
  - account-aware help path where available
  - recent service posture summary
- `/status`
  - current service health
  - active incidents
  - degraded components
  - recent resolved incidents
- optional lightweight support ticket confirmation routes
  - such as `/support/thanks`
  - or ticket detail lookups later

### Internal portal surfaces

- `/support`
  - internal support dashboard
- `/support/tickets/[id]`
  - ticket drilldown
- `/support/incidents/[id]`
  - incident command view

### Ticket types in v1

- `product_question`
- `technical_issue`
- `billing_issue`
- `account_access`
- `reward_or_claim_issue`
- `trust_or_abuse_report`
- `provider_or_integration_issue`
- `general_request`

### Incident states in v1

- `investigating`
- `identified`
- `monitoring`
- `resolved`

### Ticket states in v1

- `new`
- `triaging`
- `waiting_on_customer`
- `waiting_on_internal`
- `escalated`
- `resolved`
- `closed`

---

## File structure

### New database files

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_support_and_incident_operations_v1.sql`
  - support cases, incident records, communication history, handoff state, and public status snapshots

### New webapp files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\support\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\status\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\support\tickets\route.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\status\overview\route.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\support\support-intake-form.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\support\support-lane-grid.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\status\status-hero.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\status\status-incident-timeline.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\support\support-intake.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\status\public-status.ts`

### New portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\support\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\support\tickets\[id]\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\support\incidents\[id]\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\support\overview\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\support\tickets\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\support\tickets\[id]\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\support\incidents\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\support\incidents\[id]\route.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\support\SupportOverviewPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\support\SupportQueueTable.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\support\SupportTicketDetail.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\support\IncidentCommandPanel.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\support\IncidentStatusComposer.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\support\support-queue.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\support\incident-command.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\support.ts`

### Modified portal files

- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\settings\billing\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims\[id]\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\onchain\page.tsx`
- `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx`

### Modified webapp/public files

- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\launch\public-site-content.ts`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`
- `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\support\page.tsx`

---

## Task 1: Add support and incident schema foundation

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_support_and_incident_operations_v1.sql`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\entities\support.ts`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\types\database.ts`

- [ ] Create `support_tickets` with account-aware and project-aware linkage.
- [ ] Create `support_ticket_events` for audit history, customer-safe notes, and internal-only notes.
- [ ] Create `support_ticket_handoffs` for routing into billing, trust, payout, on-chain, or product ops.
- [ ] Create `service_incidents` with severity, impact summary, public summary, and state.
- [ ] Create `service_incident_updates` for the public timeline and internal incident notes.
- [ ] Create `service_status_snapshots` for the public status page and quick service health reads.
- [ ] Add indexes for:
  - ticket status
  - ticket type
  - account id
  - project id
  - incident status
  - public visibility
- [ ] Keep support state separate from trust/payout/on-chain case state and link only by handoff references.

## Task 2: Define the support intake model and communication language

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\support\support-contract.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-support-language-and-incident-posture.md`

- [ ] Define customer-facing support types and the exact intake fields for each.
- [ ] Define ticket states, waiting states, escalation states, and close posture.
- [ ] Define incident severities and public service-impact wording.
- [ ] Define which updates are:
  - customer-visible
  - internal-only
  - public status updates
- [ ] Write the core language model for:
  - service degradation
  - provider failures
  - billing disruption
  - account access issues
  - trust-sensitive cases
- [ ] Keep the wording calm, bounded, and specific.

## Task 3: Build customer-facing support intake and public status

**Files:**
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\support\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\status\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\support\tickets\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\api\status\overview\route.ts`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\support\support-intake-form.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\status\status-hero.tsx`
- Create: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\components\status\status-incident-timeline.tsx`

- [ ] Add a real `/support` route with structured intake, not only static text.
- [ ] Make the support form usable whether the user is signed in or not.
- [ ] Route account-aware submissions into linked tickets when session/account context exists.
- [ ] Add a public `/status` page with current platform posture and resolved incident history.
- [ ] Keep status readable and calm even when no incidents exist.
- [ ] Surface active incidents, degraded components, and the latest update without exposing raw internal detail.

## Task 4: Build the internal support dashboard and queue

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\support\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\support\overview\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\support\tickets\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\support\SupportOverviewPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\support\SupportQueueTable.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\support\support-queue.ts`

- [ ] Build an internal `/support` dashboard with queue metrics and active incident posture.
- [ ] Show:
  - new tickets
  - waiting on customer
  - waiting on internal
  - escalated
  - active incidents
- [ ] Add filterable support queue by:
  - type
  - priority
  - waiting state
  - linked account
  - linked project
- [ ] Keep the queue Veltrix-internal only.

## Task 5: Build ticket drilldown and operator actions

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\support\tickets\[id]\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\support\tickets\[id]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\support\SupportTicketDetail.tsx`

- [ ] Show full ticket context:
  - customer message
  - type
  - status
  - linked account and project
  - audit history
  - internal notes
  - customer-safe updates
- [ ] Add safe operator actions:
  - claim ticket
  - change status
  - add internal note
  - add customer update
  - escalate
  - resolve
- [ ] Add handoff actions into:
  - billing
  - trust
  - payout
  - on-chain
  - product ops

## Task 6: Build incident command and public update publishing

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\support\incidents\[id]\page.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\support\incidents\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\api\support\incidents\[id]\route.ts`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\support\IncidentCommandPanel.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\support\IncidentStatusComposer.tsx`
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\support\incident-command.ts`

- [ ] Allow Veltrix admins to declare a public incident.
- [ ] Add incident state transitions:
  - investigating
  - identified
  - monitoring
  - resolved
- [ ] Let operators draft internal notes separately from public updates.
- [ ] Publish public updates into the status page timeline.
- [ ] Keep incident communications tied to exact timestamps and operator ownership.

## Task 7: Connect support handoffs to existing operator consoles

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\settings\billing\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\claims\[id]\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\onchain\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\moderation\page.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\app\overview\page.tsx`

- [ ] Add support handoff references into the relevant operator surfaces.
- [ ] Let deep consoles see linked support ticket context without duplicating the source of truth.
- [ ] Allow support-driven escalations into billing, trust, payout, and on-chain to stay traceable.
- [ ] Surface active incidents and support pressure on the portal overview.

## Task 8: Add nav, public-site discovery, and workflow polish

**Files:**
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\components\layout\sidebar\AdminSidebar.tsx`
- Modify: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\lib\navigation\portal-nav.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\lib\launch\public-site-content.ts`
- Modify: `C:\Users\jordi\OneDrive\Documenten\New project\apps\veltrix-web\src\app\page.tsx`

- [ ] Add internal `Support` nav for Veltrix admins.
- [ ] Add public discovery for `/support` and `/status`.
- [ ] Make the support and status surfaces feel like first-class public trust rails, not buried utilities.
- [ ] Keep the status page clean enough to link directly during live incidents.

## Task 9: Verification, communication drills, and rollout notes

**Files:**
- Create: `C:\Users\jordi\OneDrive\Bureaublad\admin-portal\docs\superpowers\specs\2026-04-23-phase11-rollout-notes.md`

- [ ] Run the usual portal and webapp builds.
- [ ] Smoke test:
  - public support submission
  - public status page with no incidents
  - internal support queue
  - ticket claim and resolve
  - incident declaration
  - incident public update
  - incident resolution
  - support handoff into billing/trust/payout/on-chain
- [ ] Write the operator drill for:
  - degraded provider service
  - billing outage
  - auth outage
  - suspicious reward-claim wave
- [ ] Make sure public wording is specific and non-alarming.

---

## Recommended execution order

1. `support and incident schema`
2. `support contract and language`
3. `public support and status`
4. `internal support dashboard`
5. `ticket drilldown and actions`
6. `incident command`
7. `handoffs into operator consoles`
8. `nav and public discovery`
9. `verification and rollout`

## Definition of done

This tranche is done when:

- customers have a clear place to ask for help
- the public can see current Veltrix service posture
- Veltrix operators can triage and own support tickets in one queue
- incidents can be declared, updated, and resolved without improvising routes or wording
- support tickets can hand off cleanly into billing, trust, payout, and on-chain
- support and incident communications feel like deliberate product surfaces instead of backstage operations
