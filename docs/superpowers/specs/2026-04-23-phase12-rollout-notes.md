# Phase 12 Rollout Notes

## Scope

Phase 12 activates:

- shared activation truth across account, workspace, and member surfaces
- internal `/success` customer success cockpit
- success account drilldowns with notes, tasks, and signal context
- customer-facing activation rails in portal onboarding and account views
- member-facing activation and comeback guidance in the webapp
- in-product and email nudge logging for activation and reactivation

## Database

Run:

- `C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_customer_success_activation_and_expansion_v1.sql`

This migration creates:

- `customer_account_activation`
- `customer_account_success_notes`
- `customer_account_success_tasks`
- `customer_account_success_signals`
- `member_activation_states`
- `member_reactivation_events`
- `activation_nudges`

It also backfills initial account activation posture and member activation rows from existing onboarding, billing, and journey-linked data.

## Deploy order

1. Deploy `veltrix-web`
2. Deploy `admin-portal`

No Render deploy is required for this phase.

## Smoke sequence

### Internal success workspace

1. Open `/success`
2. Confirm overview cards render:
   - workspace health
   - success health
   - stalled accounts
   - expansion-ready accounts
3. Open one account drilldown at `/success/accounts/[id]`
4. Add one success note
5. Create one follow-up task
6. Resolve one task
7. Confirm signal, task, and note state refreshes cleanly

### Customer-facing activation

1. Open `/getting-started` in the portal
2. Confirm the activation rail explains:
   - what is complete
   - what is missing
   - why it matters
   - the next best move
3. Open `/account`
4. Confirm the same activation posture appears there without conflicting language

### Member-facing activation

1. Open `/getting-started` in `veltrix-web`
2. Confirm the account activation card renders
3. Open `/community/onboarding`
4. Confirm the member activation card reflects onboarding blockers and next action
5. Open `/community/comeback`
6. Confirm the comeback card renders for drifting/reactivation posture
7. Open `/home`
8. Confirm both workspace and member activation cues can coexist without clutter

### Nudge logging

1. Hit `/api/success/account` as an authenticated account user
2. Confirm an account activation nudge can be written into `activation_nudges`
3. Hit `/api/success/member` as an authenticated member
4. Confirm in-product member nudges can be written into `activation_nudges`
5. Confirm comeback prompt logs can land in `member_reactivation_events`
6. Confirm duplicate comeback prompts are rate-limited

### Success signal drills

Walk at least one record through each posture:

- stalled after signup
- first project never created
- paid account with low usage
- member drift after first completion
- expansion-ready workspace

Confirm the internal `/success` workspace surfaces those states clearly and the customer/member surfaces keep the language bounded and helpful.

## Acceptance bar

Phase 12 is launch-ready when:

- Veltrix has one consistent activation truth across internal, customer, and member surfaces
- internal `/success` lets the team triage activation, recovery, and expansion without spreadsheets
- customers can always see the next best move and why it matters
- members can see clear onboarding and comeback guidance
- activation and reactivation nudges are logged, bounded, and deduplicated
- support and billing context can influence success posture without creating contradictory state models
