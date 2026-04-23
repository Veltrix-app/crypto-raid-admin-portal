# Support Language And Incident Posture

## Purpose

This note fixes the communication contract for Phase 11 so support tickets, public status updates, and internal incident handling all use the same calm, bounded language.

## Ticket posture

### Customer-facing intake types

- `product_question`
- `technical_issue`
- `billing_issue`
- `account_access`
- `reward_or_claim_issue`
- `trust_or_abuse_report`
- `provider_or_integration_issue`
- `general_request`

### Ticket state model

- `new`
  - newly received and not yet owned
- `triaging`
  - an operator is reading context and deciding next ownership
- `waiting_on_customer`
  - Veltrix needs more information from the requester
- `waiting_on_internal`
  - Veltrix already has the context and is waiting on an internal operator or system action
- `escalated`
  - the ticket has crossed into a deeper operator lane like billing, trust, payout, or on-chain
- `resolved`
  - the request is handled and a final outcome has been recorded
- `closed`
  - no more action is expected and the ticket is archived operationally

### Waiting posture

- `none`
- `customer`
- `internal`
- `provider`

### Escalation posture

- `none`
- `watching`
- `escalated`
- `handoff_open`

## Incident posture

### Incident states

- `investigating`
  - we know there is impact, but the exact cause or fix is still being confirmed
- `identified`
  - we understand the failure path or the likely root cause
- `monitoring`
  - mitigation or recovery has been applied and is being watched
- `resolved`
  - service is stable again and the incident is closed

### Incident severities

- `minor`
  - bounded degradation, workaround usually exists
- `major`
  - meaningful service disruption, operator action required
- `critical`
  - broad disruption or high-risk service interruption

### Public service impact labels

- `degraded`
- `partial_outage`
- `major_outage`
- `maintenance`

## Visibility rules

### Customer-visible updates

Use for:

- intake confirmation
- safe next-step requests
- bounded progress updates
- resolution summaries

Do not expose:

- raw internal payloads
- unsafe trust details
- speculative root causes
- project-sensitive moderation evidence

### Internal-only updates

Use for:

- operator notes
- triage reasoning
- ownership changes
- internal recovery experiments
- exact provider or infra debugging context

### Public status updates

Use for:

- current state
- affected component
- bounded service impact
- the next timestamped update

Keep public wording:

- calm
- specific
- non-dramatic
- free of blame

## Language templates

### Service degradation

Use:

`Some product surfaces may feel slower or less reliable than normal. We are actively investigating and will publish the next update as soon as we have a clearer recovery path.`

### Provider failures

Use:

`A linked provider is failing or timing out. The issue is currently contained to the affected integration rail, and we will update this status once retries or manual recovery are confirmed.`

### Billing disruption

Use:

`Billing or checkout actions may not complete normally right now. Existing workspace access remains available while we work on the recovery path.`

### Account access

Use:

`Sign-in, verification or workspace access may be delayed. We are keeping the issue bounded and will publish the next update once access stability is confirmed.`

### Trust-sensitive cases

Use:

`This report touches a trust-sensitive surface. We will review it carefully and keep public or customer-facing updates bounded to what is safe to share.`

## Tone rules

- prefer exact service impact over vague reassurance
- avoid alarming language
- avoid raw internal terminology in public updates
- say what is affected, what is not yet known, and when the next update will come
- if the issue is bounded, say so explicitly
- if access remains available, say so explicitly
