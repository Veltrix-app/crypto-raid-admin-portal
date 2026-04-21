# Operator Runbooks

## Launch Day
- Open `/overview` in `Launch` mode and confirm snapshots are fresh.
- Clear critical provider failures, queue backlog, and support escalations first.
- Open the active project's `Launch Workspace` and `Community OS`.
- Confirm claims, moderation, on-chain, and community all look stable before traffic increases.

## Claims and Payout Recovery
- Open `/claims`.
- Review payout cases, project incidents, overrides, and support escalations together.
- Use `request project input`, `retry`, or `pause` deliberately instead of stacking manual retries.
- Leave one named escalation owner and one next action when the issue is not fully resolved in one sitting.

## Trust and Moderation Surge
- Open `/moderation`.
- Separate trust-case pressure from submission-pipeline pressure.
- Request project input explicitly when project evidence or operator confirmation is missing.
- Use the support escalation rail when the problem repeats or crosses provider and moderation surfaces.

## On-chain Recovery
- Open `/onchain`.
- Confirm whether the pressure is in ingress, retry, enrichment, or suspicious signals.
- Prefer project-safe recovery actions first.
- Escalate deploy or provider blockers so they stay visible in `/overview`.

## Community Drift
- Open `/projects/<id>/community`.
- Check command rails, captain workspace, automations, and provider incident posture.
- Confirm whether the next action belongs in Community, Claims, or On-chain.
- Escalate if the issue is larger than one captain task or one automation run.
