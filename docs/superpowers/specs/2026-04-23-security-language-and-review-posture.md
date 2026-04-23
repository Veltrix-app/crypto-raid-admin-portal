# Phase 14 Security Language And Review Posture

## Language posture

- Use `two-factor authentication` or `2FA`, never `MFA wall`.
- Use `enterprise SSO` or `SAML SSO`, never `corp login`.
- Use `session review` instead of `device history` because the security surface is account-centric, not consumer-device-centric.
- Use `export request` and `delete request` as the public labels for data lifecycle actions.
- Use `trust center` for buyer-facing materials and `security workspace` for in-product controls.

## Review posture

- Public trust language should be concrete and sober, not compliance theater.
- Customer-facing copy should say what the user can do now, not what might exist later.
- Internal security copy should optimize for triage speed, evidence capture and low ambiguity.
- Legal pages should read like operating materials, not generic placeholder policy pages.

## UI label rules

- `2FA required for your role` is preferred over `2FA blocked`.
- `SSO required` is preferred over `SSO only`.
- `Current AAL` can stay technical because it appears in operator-facing settings.
- `Security or DPA request` is the preferred CTA on public trust surfaces.
- `Needs review` is the default weak-posture label for internal account queues.

## Buyer review posture

- Public trust surfaces should link cleanly to `Privacy`, `Terms`, `Subprocessors`, `Status` and `Support`.
- Trust center copy should mention bounded visibility, incident handling and request lifecycle explicitly.
- Avoid promising named certifications unless they are actually live and supportable.
