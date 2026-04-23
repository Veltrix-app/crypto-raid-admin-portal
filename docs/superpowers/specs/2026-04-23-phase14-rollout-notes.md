# Phase 14 Rollout Notes

## SQL

Run:

- `database/migrations/veltrix_security_compliance_and_trust_center_hardening_v1.sql`

## Deploys

- deploy `crypto-raid-admin-portal`
- deploy `veltrix-web`

## Portal smoke flow

1. Open `/login`
2. Verify password sign-in still works
3. If the account already has TOTP, verify the login page prompts for the authenticator code
4. Open `/settings/security`
5. Start TOTP setup and verify the factor
6. Review active sessions and revoke a non-current session if available
7. Submit an `export` data request
8. If you have an owner/admin account, update the security policy and SSO settings
9. Confirm `/security` loads for super admins
10. Confirm `/security/accounts/[id]` shows requests, incidents, policy and SSO posture

## Public trust smoke flow

1. Open `/trust`
2. Open `/subprocessors`
3. Open `/privacy`
4. Open `/terms`
5. Confirm the launch-site nav now exposes `Trust`
6. Confirm footer links include `Trust` and `Subprocessors`

## Enforcement checks

1. For an enterprise-hardened account that requires 2FA for `owner/admin`, verify a non-`aal2` operator is redirected to `/settings/security`
2. For an account that requires SSO, verify a password-authenticated operator is redirected to `/settings/security`
3. Confirm the user can still reach `/settings/security` while blocked by policy

## Notes

- Enterprise SSO relies on Supabase SSO domain/provider configuration being live in the environment.
- Public trust pages assume the new `subprocessors` table is present in the database.
