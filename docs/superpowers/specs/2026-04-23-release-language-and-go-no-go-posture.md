# Release Language And Go/No-Go Posture

Phase 15 gives Veltrix one shared release language so the team stops relying on memory, chat fragments or vague deploy notes.

## Core release words

### `go`

Use `go` when:

- no blocking checks are failed
- no blocking checks are still `not_run`
- the critical smoke pack is complete
- no environment audit is `critical` or `not_reviewed`
- migrations are reviewed and not blocked

`Go` means:

- the release is allowed to move toward or remain in `verified`
- the release has enough evidence to be considered safe to operate live

### `watch`

Use `watch` when:

- no hard `P0` failure exists
- but smoke is still incomplete
- or environment posture is still not fully reviewed
- or migrations are linked but not yet fully settled

`Watch` means:

- do not call the release fully verified yet
- do not hide the remaining work
- the release may still be in rollout, but it is not closed

### `no_go`

Use `no_go` when:

- a blocking `P0` failure exists
- a hard gate is clearly broken
- a critical migration posture issue exists
- the release is unsafe to continue without intervention

`No-go` means:

- stop further promotion
- fix or mitigate the blocker
- re-review before continuing

### `degraded`

Use `degraded` as the release state when:

- the release has shipped
- but active issues now materially reduce confidence or service health
- or a release previously marked `verified` is no longer safe to treat as clean

`Degraded` means:

- the release is live but not healthy
- operators should work from mitigation and rollback posture immediately

### `rolled_back`

Use `rolled_back` when:

- code or deploy posture was intentionally moved back
- the release is no longer the live baseline

`Rolled back` means:

- the candidate is closed as the active live version
- the release should stay auditable, but no longer represents the current intended state

## Severity language

### `P0`

- launch blocker
- do not ship or do not keep calling the release healthy

### `P1`

- serious issue
- may allow rollout only with explicit acknowledgement and clear follow-up

### `P2`

- warning or medium-priority issue
- should be tracked, but is not a default stop signal by itself

### `P3`

- note-level issue
- low urgency, but still worth recording for clean release memory

## Hard-gate interpretation

In v1, these are treated as hard-gated:

- `webapp`
- `portal`
- migrations

That means their blocking checks can directly create `no_go`.

These are included in release scope but lighter-gated in v1:

- `docs`
- `community_bot`

They still need readiness review, but do not have the exact same default stop semantics.

## Verified rule

Never mark a release `verified` when any of the following are still true:

- a blocking check has failed
- a blocking check is still `not_run`
- smoke scenarios are still pending
- an environment audit is `critical`
- an environment audit is still `not_reviewed`
- a migration is blocked or still not reviewed

## Rollback expectation

Every release should carry a rollback or mitigation note.

This note should answer:

- what would we undo first?
- what can we disable safely?
- what is the database mitigation path if rollback is not clean?
- who should communicate if the release stays degraded?

