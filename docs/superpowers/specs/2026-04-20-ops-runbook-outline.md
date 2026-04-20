# Ops Runbook Outline

## Launch Day
- Check `project_operation_incidents` for fresh provider, runtime, and manual-test failures.
- Check `project_operation_overrides` for any active pause, mute, or retry overrides left over from staging.
- Confirm Community OS, Claims, and Moderation each show the correct incident count for the active project.
- Confirm Discord and Telegram test pushes still create audit entries and no new provider incidents.

## Push Incident
- Open the affected project's Community OS surface.
- Review the incident summary, target object id, and latest operator history.
- Validate the integration target, bot secret, and provider runtime health.
- Decide whether to resolve the incident, move it to `watching`, or apply a temporary `pause` or `mute` override.

## Claim / Reward Incident
- Open the Claims workspace with the affected project active.
- Validate whether the issue is a fulfillment problem, campaign finalization problem, or stock/visibility mismatch.
- Apply `manual_retry` or `pause` only when the queue should stop taking fresh pressure.
- Resolve the override as soon as the queue is healthy again.

## Moderation / Pipeline Incident
- Open Moderation with the affected project active.
- Inspect whether the issue is callback delivery, on-chain intake, or enrichment/retry backlog.
- Use the override rail only to suppress noise or pause a broken provider rail while a manual fix is in progress.
- Re-run the relevant recovery flow and move the incident to `resolved` or `watching`.

## Recovery Review
- Confirm the latest project audit history reflects the intervention that was just taken.
- Confirm there are no stale active overrides left behind after recovery.
- If the same incident repeats, escalate it into a deeper provider/runtime investigation instead of looping retries.
