# Phase 11 Rollout Notes

## Scope

Phase 11 activates:

- public support intake on `veltrix-web`
- public status page and public incident timeline
- internal support command center in `admin-portal`
- ticket drilldowns and incident command detail routes
- support handoffs into billing, trust, payout, and on-chain surfaces

## Database

Run:

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_support_and_incident_operations_v1.sql`

This migration creates:

- `support_tickets`
- `support_ticket_events`
- `support_ticket_handoffs`
- `service_incidents`
- `service_incident_updates`
- `service_status_snapshots`

It also seeds the default public status components.

## Deploy order

1. Deploy `veltrix-web`
2. Deploy `admin-portal`

No Render deploy is required for this phase.

## Smoke sequence

### Public support

1. Open `/support`
2. Submit one public ticket
3. Submit one signed-in ticket from an authenticated workspace
4. Confirm ticket rows land in `support_tickets`
5. Confirm `ticket_created` events land in `support_ticket_events`

### Public status

1. Open `/status`
2. Confirm seeded components render
3. Declare an internal incident from the portal
4. Confirm the public status page updates after the incident is created
5. Resolve the incident and confirm the component returns to `operational`

### Internal support

1. Open `/support`
2. Claim a ticket
3. Change status
4. Add an internal note
5. Add a customer-facing update
6. Create a handoff into:
   - billing
   - trust
   - payout
   - on-chain

### Surface context

Confirm the new handoff appears on:

- `/settings/billing`
- `/claims/[id]`
- `/moderation`
- `/onchain`

### Incident command

1. Open `/support/incidents/[id]`
2. Add a public update
3. Add an internal note
4. Move the incident through:
   - `investigating`
   - `identified`
   - `monitoring`
   - `resolved`

## Acceptance bar

Phase 11 is launch-ready when:

- public users can always find support and status
- support tickets keep requester, account and project context
- operators can claim, update and hand off tickets without leaving the support workspace
- incident command writes both internal and public timelines
- billing, trust, payout and on-chain surfaces visibly preserve linked support handoffs
- the public status page reflects live incident posture without leaking internal-only notes
