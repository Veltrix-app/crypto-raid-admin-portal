# Phase 16 Rollout Notes

This rollout activates the first full Veltrix commercial layer:

- public conversion hardening across homepage, start, pricing and trust
- public buyer intake on `/talk-to-sales`
- shared commercial lead and request schema
- internal `/growth`
- buyer-facing docs under `/buyer-guides`

## Rollout order

1. Run the migration:
   - `veltrix_commercial_assets_sales_operations_and_market_maturity_v1.sql`
2. Deploy `veltrix-web`
3. Deploy `veltrix-docs`
4. Deploy `crypto-raid-admin-portal`
5. Hard refresh the public site, docs and portal
6. Open:
   - `/`
   - `/start`
   - `/pricing`
   - `/trust`
   - `/talk-to-sales`
   - docs `/buyer-guides`
   - portal `/growth`

## Minimum smoke sequence

### Public conversion layer

- homepage loads and primary CTAs route cleanly
- `/start` routes into signup, pricing and talk-to-sales
- `/pricing` shows package posture and enterprise escalation path
- `/trust` links cleanly into pricing and sales contact

### Buyer intake

- `/talk-to-sales?from=homepage` submits a demo request
- `/talk-to-sales?from=trust&intent=enterprise_review` submits an enterprise review request
- success state returns cleanly and does not crash

### Internal growth workspace

- `/growth` loads for super admins
- new inbound requests appear in lead queues
- `/growth/leads/[id]` loads
- notes and follow-up tasks can be added

### Buyer-facing docs

- `/buyer-guides`
- `/buyer-guides/pricing-and-plans`
- `/buyer-guides/launch-operations`
- `/buyer-guides/enterprise-readiness`

## Data verification

After one demo request and one enterprise review request, confirm rows appear in:

- `commercial_leads`
- `commercial_lead_events`
- `commercial_lead_notes`
- `commercial_follow_up_tasks`
- `demo_requests`
- `enterprise_intake_requests`

## Commercial verification posture

Phase 16 is behaving correctly when:

- public CTAs no longer dead-end
- self-serve and enterprise routes are both obvious
- buyer requests create leads instead of disappearing into inbox-only behavior
- `/growth` shows inbound commercial activity with state, notes and follow-up
- buyer docs align with pricing, trust and enterprise language

