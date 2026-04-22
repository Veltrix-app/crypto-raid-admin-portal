# Phase 9 Rollout Notes

## Scope

This rollout covers:
- customer account creation above projects
- public signup, verify, recovery, and first-run routing
- portal `Getting Started`
- first project bootstrap
- workspace team invites and invite acceptance
- account overview and account-aware portal identity

## Required database step

Run:

`C:\Users\jordi\OneDrive\Documenten\New project\database\migrations\veltrix_accounts_identity_onboarding.sql`

Do not partially apply this rollout without the migration. The account, membership, invite, onboarding, and event rails depend on it.

## Supabase auth configuration

Add or confirm these redirect URLs in Supabase Auth:
- webapp root: `https://veltrix-web.vercel.app`
- sign up / verify flow: `https://veltrix-web.vercel.app/auth/verify`
- recovery flow: `https://veltrix-web.vercel.app/auth/recover`
- post-auth handoff: `https://veltrix-web.vercel.app/getting-started`
- public start route: `https://veltrix-web.vercel.app/start`
- portal login: `https://crypto-raid-admin-portal.vercel.app/login`
- portal getting started: `https://crypto-raid-admin-portal.vercel.app/getting-started`

If a custom domain is used later, add the matching equivalents before switching traffic.

## Environment assumptions

### veltrix-web

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Expected for clean portal handoff:
- `NEXT_PUBLIC_ADMIN_PORTAL_URL`

Current runtime assumption:
- if `NEXT_PUBLIC_ADMIN_PORTAL_URL` is not set, the webapp falls back to the current public portal URL
- webapp and portal remain separate domains and separate sessions in this phase
- first handoff into the portal may still require one extra sign-in

### admin-portal

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Email template notes

### Signup verification email

The verification link must land on:
- `https://veltrix-web.vercel.app/auth/verify`

### Password recovery email

The recovery link must land on:
- `https://veltrix-web.vercel.app/auth/recover?mode=reset`

### Workspace invite email

This phase stores invite tokens and acceptance posture, but does not yet ship a separate outbound invite email delivery system. The safe rollout posture is:
- use the portal team surface to create invites
- let the invited user sign in with the invited email
- let them accept the invite from portal `Getting Started`

If outbound invite email is added later, the acceptance target should still resolve back into:
- portal `Getting Started`
- or a dedicated portal invite acceptance page that then refreshes the same account overview

## Smoke test stories

Run these after deploy:

1. Public site -> `Start now` -> signup
2. Signup -> verify -> `veltrix-web /getting-started`
3. `Getting Started` -> create workspace account
4. Portal sign-in -> `admin-portal /getting-started`
5. Create first project -> auto-handoff into project `Launch`
6. Open account page -> confirm workspace identity, role, project count
7. Open account team page -> create invite
8. Sign in with invited email -> portal `Getting Started`
9. Accept received workspace invite
10. Refresh portal -> confirm account overview now resolves the invited workspace

## Key acceptance signals

The rollout is healthy if:
- signup no longer drops the user directly into `/home`
- webapp first-run lands on `/getting-started`
- portal limited-nav mode appears for incomplete workspaces
- first project bootstrap creates both the project and owner team membership
- `account` and `account/team` load without requiring an active project
- invite resend / revoke posture works
- invite acceptance converts into active `customer_account_memberships`

## Known limitation in this phase

- no true cross-domain SSO yet between portal and webapp
- workspace invites are portal-driven and acceptance-driven, not full email-delivery automation yet
- workspace roles are still coarse: `owner`, `admin`, `member`, `viewer`
- no billing or seat enforcement yet

## Recommended deploy order

1. merge / push portal and webapp changes
2. run the Phase 9 migration
3. deploy `veltrix-web`
4. deploy `admin-portal`
5. verify Supabase redirect URLs
6. run the smoke stories above
