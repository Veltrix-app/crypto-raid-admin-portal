# Phase 15 Rollout Notes

This rollout activates the first Veltrix release machine:

- `/releases`
- `/releases/[id]`
- `/qa`

plus the shared schema for release runs, checks, smoke results, environment audits and migration links.

## Rollout order

1. Run the migration:
   - `veltrix_qa_release_engineering_and_environment_discipline_v1.sql`
2. Deploy `crypto-raid-admin-portal`
3. Hard refresh the portal
4. Open:
   - `/releases`
   - `/qa`
5. Create one draft release candidate
6. Confirm services, checks, smoke rows and environment audits are all seeded

## Minimum smoke sequence

For launch readiness, the release machine should at minimum track and verify:

### Auth and entry

- portal `/login`
- first post-login entry surface

### Billing and account

- `/settings/billing`
- account posture and upgrade flow visibility

### Support and status

- public `/support`
- public `/status`

### Security and trust

- `/settings/security`
- `/security`
- `/trust`
- `/privacy`
- `/terms`

### Success and analytics

- `/success`
- `/analytics`

### Docs and public surfaces

- docs home
- any trust- or product-doc pages touched by the release

### Community bot readiness

- bot env posture
- callback URL posture
- operator confirmation that community flows are not silently broken

## Go/no-go rule set

Treat the release as `no_go` when:

- a blocking `P0` check fails
- migration posture is blocked
- the release is clearly unsafe to continue

Treat the release as `watch` when:

- smoke is still incomplete
- environment posture is still not fully reviewed
- migration posture is still pending but not blocked

Treat the release as `go` when:

- blocking checks are clean
- smoke is complete
- environment audits are ready
- migration posture is reviewed and not blocked

## Rollback expectation

If the release becomes degraded after deploy:

1. mark the release `degraded`
2. capture the issue in `blocker_summary`
3. update `rollback_notes` with the actual mitigation path
4. decide whether to:
   - hotfix forward
   - disable the affected path
   - roll back the deploy
5. if customer-visible, make sure the relevant support/status/security surface reflects reality

## Launch operator check

Phase 15 is behaving correctly when:

- a draft release seeds all rows
- checks can be updated
- smoke can be recorded
- environment audits can be reviewed
- migrations can be linked
- a release cannot be marked `verified` while the blocking posture is still bad
- `/qa` clearly shows what still needs action

