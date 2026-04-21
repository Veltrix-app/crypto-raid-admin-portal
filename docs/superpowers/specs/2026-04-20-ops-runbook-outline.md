# Ops Runbook Outline

## Launch Day
- Check `project_operation_incidents` for fresh provider, runtime, and manual-test failures.
- Check `project_operation_overrides` for any active pause, mute, or retry overrides left over from staging.
- Confirm Community OS, Claims, and Moderation each show the correct incident count for the active project.
- Confirm Discord and Telegram test pushes still create audit entries and no new provider incidents.
- Confirm `Overview` shows fresh metric snapshots, stable deploy checks, and no critical support escalations.

## Push Incident
- Open the affected project's Community OS surface.
- Review the incident summary, target object id, and latest operator history.
- Validate the integration target, bot secret, and provider runtime health.
- Decide whether to resolve the incident, move it to `watching`, or apply a temporary `pause` or `mute` override.
- If the issue crosses more than one surface or repeats after a retry, move it into a named support escalation with a next action.

## Claim / Reward Incident
- Open the Claims workspace with the affected project active.
- Validate whether the issue is a fulfillment problem, campaign finalization problem, or stock/visibility mismatch.
- Apply `manual_retry` or `pause` only when the queue should stop taking fresh pressure.
- Resolve the override as soon as the queue is healthy again.
- Capture whether the issue is waiting on internal work, provider recovery, or project input before leaving the rail.

## Moderation / Pipeline Incident
- Open Moderation with the affected project active.
- Inspect whether the issue is callback delivery, on-chain intake, or enrichment/retry backlog.
- Use the override rail only to suppress noise or pause a broken provider rail while a manual fix is in progress.
- Re-run the relevant recovery flow and move the incident to `resolved` or `watching`.
- Escalate repeated or cross-surface trust pressure so ownership survives queue rotation.

## On-chain Recovery
- Open the On-chain workspace with the affected project active.
- Separate failure cases from suspicious signal work before retrying.
- Use only project-safe retries, rescans or enrichment reruns unless a global operator intervention is truly required.
- Move provider or deploy blockers into the support escalation rail so Overview keeps them visible.

## Deploy Hygiene
- Confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` on the portal deployment.
- Confirm `COMMUNITY_BOT_URL`, `COMMUNITY_BOT_WEBHOOK_SECRET`, and `NEXT_PUBLIC_APP_URL` are present wherever deep links or bot callbacks depend on them.
- Redeploy the owning surface after config changes and verify the corresponding health panel clears.

## Recovery Review
- Confirm the latest project audit history reflects the intervention that was just taken.
- Confirm there are no stale active overrides left behind after recovery.
- If the same incident repeats, escalate it into a deeper provider/runtime investigation instead of looping retries.
- Confirm the support escalation was updated, resolved, or dismissed explicitly instead of just disappearing from the queue.
